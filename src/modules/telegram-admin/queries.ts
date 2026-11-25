import { createSupabaseAdminClient } from "@/core/db/admin";
import {
  DEFAULT_TELEGRAM_SETTINGS,
  getTelegramBotInfo,
  getTelegramBotSettings,
  getTelegramBotToken,
  getTelegramWebhookInfo,
  type TelegramBotAdminRecord,
  type TelegramBotSettings,
  type TelegramBotUser,
  type TelegramBroadcastRecord,
  type TelegramRequiredChannel,
} from "@/core/telegram/bot";

export interface TelegramBotAdminOverview {
  botConfigured: boolean;
  botUsername: string | null;
  botFirstName: string | null;
  webhookUrl: string | null;
  webhookPendingCount: number;
  webhookLastError: string | null;
  migrationReady: boolean;
  settings: TelegramBotSettings;
  channels: TelegramRequiredChannel[];
  botUsers: TelegramBotUser[];
  botAdmins: TelegramBotAdminRecord[];
  broadcasts: TelegramBroadcastRecord[];
  stats: {
    totalBotUsers: number;
    linkedUsers: number;
    activeChannels: number;
    todayOtps: number;
    bannedUsers: number;
  };
}

export async function getTelegramBotAdminData(): Promise<TelegramBotAdminOverview> {
  const token = getTelegramBotToken();
  const adminClient = createSupabaseAdminClient();

  const [botInfoRes, webhookRes] = token
    ? await Promise.all([getTelegramBotInfo(), getTelegramWebhookInfo()])
    : [null, null];

  const base: TelegramBotAdminOverview = {
    botConfigured: Boolean(token),
    botUsername:
      botInfoRes?.ok && botInfoRes.result?.username
        ? botInfoRes.result.username
        : process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || null,
    botFirstName: botInfoRes?.ok ? botInfoRes.result?.first_name || null : null,
    webhookUrl: webhookRes?.ok ? webhookRes.result?.url || null : null,
    webhookPendingCount: webhookRes?.ok ? webhookRes.result?.pending_update_count || 0 : 0,
    webhookLastError: webhookRes?.ok ? webhookRes.result?.last_error_message || null : null,
    migrationReady: false,
    settings: DEFAULT_TELEGRAM_SETTINGS,
    channels: [],
    botUsers: [],
    botAdmins: [],
    broadcasts: [],
    stats: {
      totalBotUsers: 0,
      linkedUsers: 0,
      activeChannels: 0,
      todayOtps: 0,
      bannedUsers: 0,
    },
  };

  if (!adminClient) return base;

  const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [
    settingsRes,
    channelsRes,
    usersRes,
    adminsRes,
    broadcastsRes,
    totalUsersCount,
    linkedUsersCount,
    bannedUsersCount,
    todayOtpsCount,
  ] = await Promise.all([
    adminClient.from("telegram_bot_settings").select("*").eq("id", 1).maybeSingle(),
    adminClient
      .from("telegram_required_channels")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    adminClient
      .from("telegram_bot_users")
      .select(
        "*, linked_user:users!telegram_bot_users_linked_user_id_fkey(id, first_name, last_name, school_id, grade)"
      )
      .order("last_seen_at", { ascending: false })
      .limit(120),
    adminClient.from("telegram_bot_admins").select("*").order("created_at", { ascending: false }),
    adminClient
      .from("telegram_broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    adminClient.from("telegram_bot_users").select("telegram_user_id", { count: "exact", head: true }),
    adminClient
      .from("telegram_bot_users")
      .select("telegram_user_id", { count: "exact", head: true })
      .not("linked_user_id", "is", null),
    adminClient
      .from("telegram_bot_users")
      .select("telegram_user_id", { count: "exact", head: true })
      .eq("is_banned", true),
    adminClient
      .from("telegram_verifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),
  ]);

  const migrationReady = !settingsRes.error && !channelsRes.error;
  const settings = migrationReady
    ? await getTelegramBotSettings(adminClient)
    : DEFAULT_TELEGRAM_SETTINGS;
  const channels = (channelsRes.data || []) as TelegramRequiredChannel[];

  return {
    ...base,
    migrationReady,
    settings,
    channels,
    botUsers: (usersRes.data || []) as unknown as TelegramBotUser[],
    botAdmins: (adminsRes.data || []) as TelegramBotAdminRecord[],
    broadcasts: (broadcastsRes.data || []) as TelegramBroadcastRecord[],
    stats: {
      totalBotUsers: totalUsersCount.count ?? 0,
      linkedUsers: linkedUsersCount.count ?? 0,
      activeChannels: channels.filter((c) => c.is_active).length,
      todayOtps: todayOtpsCount.count ?? 0,
      bannedUsers: bannedUsersCount.count ?? 0,
    },
  };
}
