'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Headphones, Send, Book, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

const supportSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type SupportForm = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: '',
      category: '',
      message: '',
    },
  });

  const onSubmit = async (data: SupportForm) => {
    try {
      // Simulate form submission delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would call an API endpoint
      // For now, we show a success message
      console.log('Support request:', data);

      setSubmitStatus('success');
      reset();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Support submission error:', error);
      setSubmitStatus('error');

      // Reset error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Headphones className="h-3 w-3" />
          SUPPORT
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          We're here to help.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tell us what you're working on and we'll help you find a solution.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/help">
          <Card className="p-6 hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                <Book className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Help Center
                </h3>
                <p className="text-sm text-muted-foreground">
                  Browse articles and find answers to common questions
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/help/docs">
          <Card className="p-6 hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Documentation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detailed technical guides and product documentation
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Contact Form */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Contact Support
        </h2>
        <p className="text-muted-foreground mb-8">
          Fill out the form below and our team will get back to you
        </p>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <div>
              <strong className="font-semibold">Message sent</strong>
              <p className="text-sm mt-1">
                We've received your request and will respond soon.
              </p>
            </div>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div>
              <strong className="font-semibold">We couldn't send your request</strong>
              <p className="text-sm mt-1">
                Please try again or contact us through the Help Center.
              </p>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subject */}
          <div>
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Brief description of your issue"
              className="mt-2"
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="mt-1.5 text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              {...register('category')}
              className="mt-2 w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              <option value="general">General Question</option>
              <option value="technical">Technical Issue</option>
              <option value="account">Account</option>
              <option value="billing">Billing</option>
              <option value="integration">Integration</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
            </select>
            {errors.category && (
              <p className="mt-1.5 text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Please provide details about your question or issue..."
              rows={6}
              className="mt-2"
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1.5 text-sm text-destructive">{errors.message.message}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Include as much detail as possible to help us assist you better
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Card>

      {/* Additional Resources */}
      <div className="mt-12 p-8 rounded-xl bg-muted/50 border border-border">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Need immediate help?
          </h3>
          <p className="text-muted-foreground mb-6">
            Check out our Help Center for instant answers
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/help">
              <Button variant="outline">
                <Book className="h-4 w-4 mr-2" />
                Browse Help Center
              </Button>
            </Link>
            <Link href="/help/docs">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
