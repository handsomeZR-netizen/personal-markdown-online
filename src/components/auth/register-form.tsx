"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { t } from "@/lib/i18n"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { registerUser } from "@/lib/actions/auth"

export function RegisterForm() {
    const router = useRouter()
    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: RegisterInput) {
        try {
            console.log("提交注册表单:", values)
            
            // 使用 API 路由进行注册
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    password: values.password,
                }),
            })

            const data = await response.json()
            console.log("注册响应:", response.status, data)

            if (!response.ok) {
                toast.error(data.message || '注册失败')
                return
            }

            toast.success(t('auth.registerSuccess'))
            router.push("/login")
        } catch (error: unknown) {
            console.error("注册错误:", error)
            toast.error(error.message || t('errors.generic'))
        }
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>{t('auth.register')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('auth.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="张三" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('auth.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('auth.password')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">{t('auth.register')}</Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {t('auth.hasAccount')} <Link href="/login" className="text-primary hover:underline">{t('auth.loginNow')}</Link>
                </p>
            </CardFooter>
        </Card>
    )
}
