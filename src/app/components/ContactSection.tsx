'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const contactInfo = [
  { icon: 'EnvelopeIcon', label: 'Email Us', value: 'hello@homevibe.com', sub: 'We reply within 24 hours' },
  { icon: 'PhoneIcon', label: 'Call Us', value: '+1 (415) 555-0182', sub: 'Mon–Fri, 9am–6pm PST' },
  { icon: 'MapPinIcon', label: 'Visit Us', value: '340 Pacific Ave, San Francisco, CA 94111', sub: 'Showroom open Tue–Sat' },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static mock submit handler — connect to your backend or email service here
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Get In Touch</p>
          <h2 className="text-display text-foreground">
            We'd Love To<br />
            <span className="text-primary">Hear From You</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {contactInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 bg-secondary rounded-2xl border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-bold text-foreground text-sm">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="p-6 bg-primary rounded-2xl text-primary-foreground mt-2">
              <p className="font-black text-lg mb-2">Order Support</p>
              <p className="text-sm opacity-80 leading-relaxed">Track your order, report an issue, or request a return — our team is here to help.</p>
              <button className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-90 hover:opacity-100 transition-opacity">
                Track My Order <Icon name="ArrowRightIcon" size={14} />
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 lg:p-10 shadow-warm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label htmlFor="subject" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="What's on your mind?"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitted}
                className={`btn-primary w-full justify-center text-sm ${submitted ? 'opacity-80 cursor-default' : ''}`}
              >
                {submitted ? (
                  <>
                    <Icon name="CheckCircleIcon" size={18} variant="solid" />
                    Message Sent!
                  </>
                ) : (
                  <>
                    Send Message
                    <Icon name="PaperAirplaneIcon" size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}