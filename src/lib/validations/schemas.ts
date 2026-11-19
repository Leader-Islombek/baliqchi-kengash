import { z } from "zod";
import { normalizeUzPhone } from "@/lib/utils";

export const registerSchema = z
  .object({
    first_name: z.string().trim().min(2, "Ism kamida 2 ta harfdan iborat bo‘lsin").max(60),
    last_name: z.string().trim().min(2, "Familiya kamida 2 ta harfdan iborat bo‘lsin").max(60),
    school_id: z.string().min(1, "61 ta maktabdan o‘z maktabingizni tanlang"),
    grade: z.coerce.number().int().min(5, "5–11-sinflar tanlanishi kerak").max(11, "5–11-sinflar tanlanishi kerak"),
    phone: z
      .string()
      .trim()
      .refine((val) => normalizeUzPhone(val) !== null, {
        message: "O‘zbekiston telefon raqamini to‘g‘ri kiriting (masalan: +998901234567)",
      }),
    password: z
      .string()
      .min(8, "Parol kamida 8 ta belgidan iborat bo‘lishi shart")
      .max(72),
    confirm_password: z.string(),
    requested_role: z
      .enum([
        "student",
        "school_coordinator",
        "school_leader",
        "district_coordinator",
        "district_leader",
        "school_advisor",
      ])
      .default("student"),
    requested_direction_id: z.string().optional().nullable(),
    request_note: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Parollar bir-biriga mos emas",
  });

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((val) => normalizeUzPhone(val) !== null, {
      message: "Telefon raqamini to‘g‘ri kiriting (+998XXXXXXXXX)",
    }),
  password: z.string().min(6, "Parolni kiriting"),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(5, "Loyiha nomi kamida 5 belgi bo‘lsin").max(180),
  direction_id: z.string().min(1, "Yo‘nalishni tanlang"),
  school_id: z.string().min(1, "Maktabni tanlang"),
  problem_statement: z.string().trim().min(20, "Muammo va dolzarblikni batafsil yozing").max(3000),
  goal: z.string().trim().min(15, "Loyihaning maqsadini aniq yozing").max(2000),
  proposed_solution: z.string().trim().min(20, "Taklif qilinayotgan yechimni yozing").max(3000),
  implementation_plan: z.string().trim().min(20, "Amalga oshirish rejasini yozing").max(4000),
  expected_result: z.string().trim().min(15, "Kutilayotgan natijani yozing").max(2500),
  required_resources: z.string().trim().min(5, "Kerakli resurslarni ko‘rsating").max(2000),
  duration_text: z.string().trim().min(3, "Amalga oshirish muddatini kiriting").max(120),
  cover_image_url: z.string().url("To‘g‘ri rasm URL manzilini kiriting").optional().or(z.literal("")),
  submit_immediately: z.boolean().default(true),
});

export const projectUpdateSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().trim().min(4, "Sarlavha kiriting").max(160),
  content: z.string().trim().min(15, "Jarayon tafsilotlarini yozing").max(3000),
  progress_percent: z.coerce.number().int().min(0).max(100),
  results_achieved: z.string().max(1500).optional().nullable(),
  challenges: z.string().max(1500).optional().nullable(),
  show_on_homepage: z.boolean().default(true),
});

export const commentSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().trim().min(2, "Izoh kamida 2 belgi bo‘lsin").max(1500),
  parent_id: z.string().uuid().optional().nullable(),
});

export const groupMessageSchema = z.object({
  group_id: z.string().uuid(),
  message_type: z.enum(["message", "announcement", "task", "report"]).default("message"),
  title: z.string().max(160).optional().nullable(),
  content: z.string().trim().min(2, "Xabar matnini kiriting").max(4000),
  is_pinned: z.boolean().default(false),
});

export const initiativeSchema = z.object({
  direction_id: z.string().min(1, "Yo‘nalishni tanlang"),
  title: z.string().trim().min(5, "Tashabbus nomini yozing").max(160),
  problem_summary: z.string().trim().min(15, "Muammoni qisqacha tushuntiring").max(1000),
  idea_details: z.string().trim().min(20, "G‘oyangiz tafsilotlarini yozing").max(2500),
});

export const reportSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  school_id: z.string().uuid().optional().nullable(),
  direction_id: z.string().uuid().optional().nullable(),
  period_label: z.string().trim().min(3, "Hisobot davrini kiriting (masalan: 2026-yil 4-hafta)").max(100),
  summary: z.string().trim().min(20, "Hisobot mazmunini batafsil yozing").max(5000),
});

export const eventSchema = z.object({
  title: z.string().trim().min(4).max(180),
  description: z.string().trim().min(15).max(4000),
  school_id: z.string().uuid().optional().nullable(),
  direction_id: z.string().uuid().optional().nullable(),
  location: z.string().trim().min(3).max(200),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().nullable(),
  status: z.enum(["planned", "ongoing", "completed", "cancelled"]).default("planned"),
  cover_image_url: z.string().url().optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(4).max(200),
  excerpt: z.string().trim().max(400).optional().nullable(),
  content: z.string().trim().min(20).max(10000),
  category: z.enum(["news", "announcement", "charter_update"]).default("news"),
  scope: z.enum(["district", "school", "direction"]).default("district"),
  school_id: z.string().uuid().optional().nullable(),
  direction_id: z.string().uuid().optional().nullable(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  is_pinned: z.boolean().default(false),
});

export const rankingWeightsSchema = z.object({
  completed_projects_weight: z.coerce.number().min(0).max(100),
  in_progress_projects_weight: z.coerce.number().min(0).max(100),
  events_weight: z.coerce.number().min(0).max(100),
  reports_weight: z.coerce.number().min(0).max(100),
  direction_activity_weight: z.coerce.number().min(0).max(100),
  participation_weight: z.coerce.number().min(0).max(100),
});

export const votingWeekSchema = z.object({
  week_code: z.string().trim().min(4).max(40),
  title: z.string().trim().min(4).max(160),
  description: z.string().max(1000).optional().nullable(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  status: z.enum(["upcoming", "active", "closed", "finalized"]).default("upcoming"),
});
