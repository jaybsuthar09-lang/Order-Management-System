import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  footer: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const { data: company } = trpc.company.getSettings.useQuery();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      gstNumber: "",
      footer: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        gstNumber: company.gstNumber || "",
        footer: company.footer || "",
      });
      if (company.logoUrl) setLogoPreview(company.logoUrl);
      if (company.signatureUrl) setSignaturePreview(company.signatureUrl);
    }
  }, [company, form]);

  const updateMutation = trpc.company.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Company settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update company settings");
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate({
      ...data,
      logoUrl: logoPreview || undefined,
      signatureUrl: signaturePreview || undefined,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground mt-2">Configure company information and branding</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Company address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="company@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="27AABCT1234H1Z0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="footer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Footer text for delivery memos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Branding Card */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload company logo and digital signature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <FormLabel>Company Logo</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Logo (PNG)</span>
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {logoPreview && (
                    <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img src={logoPreview} alt="Logo" className="max-w-full max-h-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Upload */}
              <div className="space-y-3">
                <FormLabel>Digital Signature</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Signature (PNG)</span>
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {signaturePreview && (
                    <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img src={signaturePreview} alt="Signature" className="max-w-full max-h-full" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
