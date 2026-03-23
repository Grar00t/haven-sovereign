import { cn } from '../../lib/utils';
import { ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

export const Pricing = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  const plans = [
    { name: "Free", price: "0", desc: "Secure browsing with limited smart assistant.", features: ["Safe Browsing", "Basic HAVEN Assistant", "Local History"] },
    { name: "Basic", price: "29", desc: "Full smart assistant for government transactions.", features: ["Full HAVEN Assistant", "Gov Transaction Support", "Ad-Free Experience"], popular: true },
    { name: "Premium", price: "79", desc: "Advanced automation and priority support.", features: ["Advanced Automation", "Priority Support", "Early Access to Features"] },
  ];

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.flexAccess}</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {t.sections.pricingPlans} <br />
            <span className="text-white/20">{t.sections.forAll}</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className={cn(
                "glass p-10 rounded-[40px] flex flex-col relative h-full",
                plan.popular && "border-neon-green/50 shadow-[0_0_40px_rgba(0,255,0,0.1)]"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-green text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="text-2xl font-bold mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/40 text-sm">SAR/month</span>
                </div>
                <p className="text-white/50 text-sm mb-8">{plan.desc}</p>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-white/70">
                      <ShieldCheck className="w-4 h-4 text-neon-green" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all",
                  plan.popular ? "bg-neon-green text-black hover:scale-[1.02]" : "bg-white/5 hover:bg-white/10"
                )}>
                  Get Started
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
