import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少需要 8 个字符"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "请输入显示名称")
      .max(64, "名称过长"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(8, "密码至少需要 8 个字符"),
    confirm: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
