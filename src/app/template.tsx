import { PageTransition } from "@/core/ui/shared/motion-primitives";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
