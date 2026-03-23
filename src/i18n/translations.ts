export type Language = 'en' | 'ar';

export interface Translations {
  nav: { products: string; expose: string; niyah: string; story: string; models: string; team: string; launchApp: string; ide: string };
  hero: { badge: string; title: string; titleSub: string; desc: string; download: string; whyBuilt: string };
  stats: { models: string; context: string; memory: string; sdaia: string };
  sections: {
    ecosystem: string; oneVision: string; nineProducts: string;
    sovereignEngine: string; havenModel: string; llamaArch: string;
    newScience: string; niyahLogic: string; beyondPrompt: string;
    sovereignContract: string; digitalCitizenship: string; claimRights: string;
    infraAudit: string; theMachine: string; underHood: string;
    flexAccess: string; pricingPlans: string; forAll: string;
    forensicEvidence: string; aiExpose: string; unmasking: string;
    incident: string; githubDeleted: string; havenBorn: string;
    minds: string; theTeam: string; building: string;
    faqTitle: string; faqSub: string;
  };
  faq: { q: string; a: string }[];
  command: { placeholder: string; title: string };
  footer: { tagline: string; motto: string };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      products: 'Products', expose: 'Research', niyah: 'Niyah Engine',
      story: 'Our Story', models: 'Models', team: 'Team',
      launchApp: 'Launch App', ide: 'IDE',
    },
    hero: {
      badge: 'Privacy-First AI · Local Inference · Open Source',
      title: 'HAVEN', titleSub: 'IDE',
      desc: 'A development environment where AI runs entirely on your machine. Local models, zero telemetry, and an intent engine that understands why you code — not just what you type.',
      download: 'Get Started Free', whyBuilt: 'How It Works',
    },
    stats: { models: 'AI Models', context: 'Context Window', memory: 'Memory', sdaia: 'Privacy Certified' },
    sections: {
      ecosystem: '// The Haven Ecosystem', oneVision: 'One Platform.', nineProducts: 'Complete Toolkit.',
      sovereignEngine: '// THE AI ENGINE', havenModel: 'HAVEN', llamaArch: 'Multi-Model Architecture.',
      newScience: '// INTENT-AWARE AI', niyahLogic: 'NIYAH', beyondPrompt: 'Beyond Simple Prompts.',
      sovereignContract: '// DATA OWNERSHIP', digitalCitizenship: 'Your Data.', claimRights: 'Your Machine.',
      infraAudit: '// TECHNICAL ARCHITECTURE', theMachine: 'The', underHood: 'Under the Hood.',
      flexAccess: '// Flexible Access', pricingPlans: 'Pricing Plans.', forAll: 'For Individuals & Teams.',
      forensicEvidence: '// CASE STUDY', aiExpose: 'AI', unmasking: 'Transparency Report.',
      incident: '// The Problem We Set Out to Solve', githubDeleted: 'Data Dependency.', havenBorn: 'Haven Was Built.',
      minds: '// The People Behind HAVEN', theTeam: 'The Team.', building: 'Building Better Developer Tools.',
      faqTitle: 'Frequently Asked Questions', faqSub: 'Everything you need to know about HAVEN',
    },
    faq: [
      { q: 'What is HAVEN?', a: 'HAVEN is a privacy-first AI development environment. It includes a full IDE with terminal, file explorer, git integration, and AI assistance — all running locally on your hardware with zero telemetry.' },
      { q: 'Does my code leave my machine?', a: 'No. HAVEN runs AI models locally via Ollama. Your source code, prompts, and completions never leave your device. There is no cloud dependency for core functionality.' },
      { q: 'How is HAVEN different from other AI coding tools?', a: 'Most AI coding tools send your code to remote servers for processing. HAVEN runs everything locally. It also includes the Niyah Engine — an intent-understanding system that provides context-aware suggestions based on your workflow, not just keywords.' },
      { q: 'What is the Niyah Engine?', a: 'Niyah means "intention" in Arabic. It is a three-lobe processing architecture — Executive (decision-making), Sensory (input processing), and Cognitive (context memory) — that understands developer intent rather than just matching text patterns.' },
      { q: 'Is HAVEN free?', a: 'HAVEN IDE is free and open source. The core features — local AI, terminal, file explorer, git, and the Niyah Engine — are all available at no cost.' },
      { q: 'What models does HAVEN support?', a: 'HAVEN works with any model supported by Ollama — Llama, Mistral, CodeLlama, Phi, Gemma, Qwen, DeepSeek, and more. You choose the model that fits your hardware and needs.' },
    ],
    command: { placeholder: 'Search commands...', title: 'Command Palette' },
    footer: { tagline: 'Privacy-first AI development tools. Your code stays on your machine.', motto: 'BUILT BY KHAWRIZM' },
  },
  ar: {
    nav: {
      products: 'المنتجات', expose: 'الأبحاث', niyah: 'منطق النية',
      story: 'قصتنا', models: 'النماذج', team: 'الفريق',
      launchApp: 'تشغيل التطبيق', ide: 'بيئة التطوير',
    },
    hero: {
      badge: 'ذكاء اصطناعي سيادي · صُنع في السعودية · يعيش على سطح مكتبك',
      title: 'HAVEN', titleSub: 'سطح المكتب',
      desc: 'الذكاء الاصطناعي الذي يعيش على شاشتك — خفي، قوي، سيادي. شبح يعيش في نظامك، يرى سياقك، ولا يرسل بياناتك للخارج أبداً.',
      download: 'حمّل مجاناً', whyBuilt: 'لماذا بنينا هذا',
    },
    stats: { models: 'نماذج ذكاء', context: 'فقدان سياق', memory: 'الذاكرة', sdaia: 'متوافق مع سدايا' },
    sections: {
      ecosystem: '// نظام HAVEN البيئي', oneVision: 'رؤية واحدة.', nineProducts: 'مجموعة أدوات متكاملة.',
      sovereignEngine: '// المحرك السيادي', havenModel: 'HAVEN', llamaArch: 'معمارية Llama 405.',
      newScience: '// العلم الجديد · منطق النية', niyahLogic: 'النية', beyondPrompt: 'ما بعد الأوامر الغبية.',
      sovereignContract: '// العقد السيادي', digitalCitizenship: 'المواطنة', claimRights: 'طالب بحقوقك.',
      infraAudit: '// تدقيق البنية التحتية', theMachine: 'الآلة', underHood: 'تحت الغطاء.',
      flexAccess: '// وصول سيادي مرن', pricingPlans: 'خطط الأسعار.', forAll: 'للأفراد والشركات.',
      forensicEvidence: '// أدلة جنائية · ملف FLYNAS-GROK', aiExpose: 'فضيحة الذكاء', unmasking: 'كشف الحراس.',
      incident: '// الحادثة التي بدأت كل شيء', githubDeleted: 'GitHub حذفت.', havenBorn: 'HAVEN وُلد.',
      minds: '// العقول خلف HAVEN', theTeam: 'الفريق.', building: 'بناء السيادة الرقمية.',
      faqTitle: 'الأسئلة الشائعة', faqSub: 'كل ما تحتاج معرفته عن HAVEN',
    },
    faq: [
      { q: 'ما هو HAVEN؟', a: 'HAVEN هو نظام بيئي سيادي للذكاء الاصطناعي صُنع في المملكة العربية السعودية. يشمل رفيق سطح المكتب، والمتصفح، وبيئة التطوير، وأكثر — كلها مصممة بمعمارية الخصوصية أولاً بدون أي تتبع.' },
      { q: 'هل يتم إرسال بياناتي لخوادم خارجية؟', a: 'أبداً. HAVEN يعالج كل شيء محلياً على جهازك. لا تخرج أي بيانات من جهازك. نحن متوافقون مع سدايا ونظام حماية البيانات الشخصية.' },
      { q: 'كيف يختلف HAVEN عن Copilot أو Grok؟', a: 'بخلاف Copilot (الذي يفقد الذاكرة) وGrok (غير المفلتر والخطير على الأطفال)، HAVEN يستخدم ذاكرة سياق بدون فقدان ومبني بمنطق النية.' },
      { q: 'ما هو منطق النية (L.O.I)؟', a: 'منطق النية — علم جديد يستبدل هندسة الأوامر الميكانيكية بالتواصل المقصود. متجذر في عمق اللغة العربية، يسمح لـ HAVEN بفهم ليس فقط كلماتك، بل نيتك.' },
      { q: 'هل HAVEN مجاني؟', a: 'HAVEN يقدم باقة مجانية مع تصفح آمن ومساعد ذكاء أساسي. الباقات المميزة تفتح القدرات الكاملة بما في ذلك الأتمتة المتقدمة والدعم ذو الأولوية.' },
      { q: 'ما هو K-Forge؟', a: 'K-Forge هو منصة المستودعات اللامركزية غير القابلة للحذف — البديل السيادي لـ GitHub. بعد أن حذفت Microsoft مستودعاتنا مرتين، بنينا منصة لا يمكن فيها حذف أكوادك أبداً.' },
    ],
    command: { placeholder: 'ابحث في الأوامر...', title: 'لوحة الأوامر' },
    footer: { tagline: 'بنية تحتية سيادية للذكاء الاصطناعي صُنعت للعالم، متجذرة في السعودية. بياناتك، جهازك، قواعدك.', motto: 'الخوارزمية دائماً تعود للوطن' },
  },
};

export function useTranslation(language: Language) {
  return translations[language];
}
