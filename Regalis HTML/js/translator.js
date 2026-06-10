/**
 * PMA Language Translator Coordinator
 * Handles dynamic i18next loading, local storage persistence,
 * RTL/LTR stylesheet switching, dropdown updates, and content translation.
 */

(function () {
  'use strict';

  // Supported languages config
  const SUPPORTED_LANGS = ['en', 'ur', 'ar', 'ch', 'psh', 'sd'];
  const STORAGE_KEY = 'pma-lang';

  // Fallback translations in case of offline usage or CORS file:// errors
  const fallbackResources = {
    en: {
      translation: {
        nav: {
          home: "Home",
          about: "About PMA",
          mediation: "Mediation",
          services: "Services",
          training: "Training",
          leadership: "Leadership",
          resources: "Resources",
          events: "Events",
          contact: "Contact Us",
          membership: "Become a Member"
        },
        hero: {
          title_part1: "Promoting Peaceful Resolution",
          title_part2: "Through Dialogue, Understanding & Respect",
          description1: "We promote mediation as an effective, efficient, confidential, and collaborative alternative to traditional litigation.",
          description2: "Through structured dialogue and professional facilitation, we help individuals, families, businesses, and institutions resolve conflicts amicably — while preserving relationships and reducing time, cost, and stress.",
          btn_consult: "Request a Free Consultation",
          btn_training: "Explore Training Programs"
        },
        features: {
          confidential_title: "Confidential & Private",
          confidential_desc: "Your discussions remain fully secure and protected.",
          faster_title: "Faster Resolution",
          faster_desc: "Resolve disputes in days or weeks instead of months.",
          cost_title: "Cost-Effective Solution",
          cost_desc: "Avoid expensive legal fees and lengthy court battles."
        },
        glance: {
          title: "PMA at a <span class='pma-about-heading-accent'>Glance</span>",
          founded: "Founded 2013–14",
          founded_label: "Pakistan's First Mediation Association",
          mediations: "2000+",
          mediations_label: "Successful Mediations & Facilitation Cases",
          mediators: "100+",
          mediators_label: "Certified Mediators Across Pakistan",
          training: "100+",
          training_label: "Training Programs Delivered",
          impact: "National Impact",
          impact_label: "Advancing ADR Awareness & Policy Reform"
        },
        about: {
          years: "YEARS",
          stat_label: "Promoting Mediation Excellence",
          tab1_title: "About PMA",
          tab1_text: "PMA (Pakistan Mediators Association) is an independent institution established to promote peaceful dispute resolution through mediation and Alternative Dispute Resolution (ADR) across Pakistan. With internationally accredited mediators and trainers, PMA works actively to advance mediation awareness, professional training, institutional ADR development, and policy advocacy. Our mission is to create accessible, confidential, and effective conflict resolution systems that help individuals, businesses, organizations, and communities resolve disputes efficiently while preserving relationships and reducing unnecessary litigation.",
          tab2_title: "Our Vision",
          tab2_text: "To establish mediation as the leading and most trusted method of dispute resolution in Pakistan, promoting a culture of constructive dialogue, mutual understanding, and peaceful coexistence.",
          tab3_title: "Our Mission",
          tab3_mission1: "To promote mediation as an accessible and effective dispute resolution mechanism",
          tab3_mission2: "To train and accredit mediators in line with international standards",
          tab3_mission3: "To collaborate with courts, government institutions, and private sectors",
          tab3_mission4: "To raise awareness about the benefits of mediation across society",
          tab4_title: "Our Impact",
          tab4_text1: "PMA has successfully trained hundreds of lawyers, Judges, professionals and has played a key role in promoting court-connected mediation initiatives in Pakistan.",
          tab4_text2: "We continue to work closely with the judiciary and stakeholders to strengthen mediation as a sustainable dispute resolution system.",
          info_phone_label: "Need Our Services?",
          info_phone_val: "Call: +92 300 000 0000",
          info_hours_label: "Opening Hours",
          info_hours_val: "Mon-Fri (9am to 5pm)",
          info_email_label: "Email Us",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "What is <span class='pma-about-heading-accent'>Mediation?</span>",
          text1: "Mediation is a voluntary, confidential, and structured process where a neutral mediator helps the parties in conflict to communicate, understand each other's perspectives and reach a mutually acceptable solution.",
          text2: "It empowers the parties to shape the outcome, preserves relationships and saves time, cost and emotional stress.",
          btn: "Understand the Mediation Process"
        },
        why_choose: {
          title: "Why Choose <span class='pma-about-heading-accent'>PMA?</span>",
          lead: "We combine international standards with local understanding to deliver ethical, effective, and sustainable ADR solutions.",
          btn: "Learn More About PMA",
          features: {
            f1_title: "International Standards", f1_desc: "We follow globally recognized mediation principles and practices.",
            f2_title: "Experienced & Certified Mediators", f2_desc: "Our panel includes highly trained and accredited professionals.",
            f3_title: "Confidential Process", f3_desc: "Your privacy is our top priority at every stage.",
            f4_title: "Faster & Amicable Outcomes", f4_desc: "We help resolve disputes efficiently and effectively.",
            f5_title: "Cost Effective", f5_desc: "A practical alternative to expensive and lengthy litigation."
          }
        },
        training: {
          title: "Professional Training & <span class='pma-about-heading-accent'>Accreditation</span>",
          text: "PMA provides internationally aligned mediation training and professional development programs designed for lawyers, corporate professionals, HR teams, educators, and aspiring mediators.",
          card_text: "Our training programs meet international standards and empower professionals to become effective, ethical, and globally competent mediators.",
          btn: "Explore Training Programs"
        },
        services: {
          title: "Our <span class='pma-about-heading-accent'>Core</span> Services",
          list: {
            s1: { title: "Commercial & Corporate Mediation", desc: "Resolving business, partnership, contractual, and commercial disputes efficiently." },
            s2: { title: "Court-Referred Mediation", desc: "Alternative dispute resolution support for court-connected matters." },
            s3: { title: "Family & Community Mediation", desc: "Helping families and communities resolve disputes peacefully and respectfully." },
            s4: { title: "Workplace & Organizational Disputes", desc: "Addressing internal workplace conflicts and organizational disagreements." },
            s5: { title: "IMI-Certified Mediator Training", desc: "Professional mediator certification and skills development programs." },
            s6: { title: "Workshops & Awareness Programs", desc: "Educational sessions promoting ADR awareness and conflict resolution culture." },
            s7: { title: "Institutional & Policy Advisory", desc: "Supporting institutions in building ADR systems and mediation frameworks." }
          }
        },
        leadership: {
          title: "Meet Our Leadership",
          roles: {
            president: "President",
            secretary: "Secretary General",
            vp_north: "Vice President – North",
            vp_south: "Vice President – South"
          }
        },
        stats: {
          s1: { label: "Mediations Facilitated", unit: "+" },
          s2: { label: "Successful Resolutions", unit: "%" },
          s3: { label: "100% Private Process", value: "Confidential" },
          s4: { label: "Trained Mediators", value: "Certified" }
        },
        partners: {
          title: "Our Partners",
          p1: "Sindh High Court",
          p2: "Govt. Institutions",
          p3: "International Mediation Institute"
        },
        cta: {
          title: "Let's Talk Because We Can.",
          subtitle: "Ready to resolve your dispute peacefully? Or interested in becoming a certified mediator? Contact Us Today",
          btn1: "Request a Free Consultation",
          btn2: "Become a Certified Mediator",
          link: "Chat instantly with our team"
        },
        footer: {
          brand: {
            tagline: "Promoting peaceful resolution through dialogue, mediation, and mutual understanding across Pakistan.",
            logo_alt: "Pakistan Mediators Association"
          },
          quick_links: {
            title: "Quick Links",
            items: [
              { label: "Home", link: "index.html" },
              { label: "About PMA", link: "about.html" },
              { label: "Mediation", link: "mediation.html" },
              { label: "Services", link: "services.html" },
              { label: "Training", link: "training.html" },
              { label: "Leadership", link: "leadership.html" },
              { label: "Resources", link: "resources.html" },
              { label: "Events", link: "events.html" },
              { label: "Contact Us", link: "contact.html" }
            ]
          },
          services: {
            title: "Our Services",
            items: [
              "Mediation Services",
              "IMI-Certified Mediator Training",
              "ADR Workshops & Awareness Sessions",
              "Institutional ADR Advisory",
              "Policy & Mediation Advocacy"
            ]
          },
          contact: {
            title: "Contact Info",
            hours: "Mon To Fri (9am to 5pm)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 Pakistan Mediators Association (PMA). All rights reserved.",
            legal: [
              { label: "FAQ's", link: "faq.html" },
              { label: "Privacy Policy", link: "privacy-policy.html" },
              { label: "Complaint & Appeal Policy", link: "complaint-policy.html" },
              { label: "Terms and Conditions", link: "terms.html" }
            ]
          }
        }
      }
    },
    ur: {
      translation: {
        nav: {
          home: "ہوم",
          about: "پی ایم اے کے بارے میں",
          mediation: "میڈیشن",
          services: "خدمات",
          training: "ٹریننگ",
          leadership: "لیڈرشپ",
          resources: "وسائل",
          events: "ایونٹس",
          contact: "رابطہ کریں",
          membership: "ممبر بنیں"
        },
        hero: {
          title_part1: "پرامن حل کو فروغ دینا",
          title_part2: "مکالمے، تفہیم اور احترام کے ذریعے",
          description1: "ہم روایتی قانونی چارہ جوئی کے متبادل کے طور پر میڈیشن کو ایک موثر، کفایت شعار، خفیہ اور باہمی تعاون کے ذریعہ فروغ دیتے ہیں۔",
          description2: "منظم مکالمے اور پیشہ ورانہ سہولت کاری کے ذریعے، ہم افراد، خاندانوں، کاروباروں اور اداروں کی تنازعات کو خوش اسلوبی سے حل کرنے میں مدد کرتے ہیں — جس سے تعلقات برقرار رہتے ہیں اور وقت، لاگت اور ذہنی دباؤ میں کم آتا ہے۔",
          btn_consult: "مفت مشاورت کی درخواست کریں",
          btn_training: "تربیتی پروگرام دیکھیں"
        },
        features: {
          confidential_title: "خفیہ اور نجی",
          confidential_desc: "آپ کی بات چیت مکمل طور پر محفوظ ہے۔",
          faster_title: "تیز تر حل",
          faster_desc: "تنازعات کو مہینوں کے بجائے دنوں یا ہفتوں میں حل کریں۔",
          cost_title: "کم خرچ حل",
          cost_desc: "مہنگی قانونی فیسوں اور لمبی عدالتی لڑائیوں سے بچیں۔"
        },
        glance: {
          title: "ایک نظر میں PMA",
          founded: "قیام 2013–14",
          founded_label: "پاکستان کی پہلی میڈیشن ایسوسی ایشن",
          mediations: "2000+",
          mediations_label: "کامیاب میڈیشن اور سہولت کاری کے کیسز",
          mediators: "100+",
          mediators_label: "پاکستان بھر میں تصدیق شدہ ثالث",
          training: "100+",
          training_label: "تربیتی پروگرامز",
          impact: "قومی اثر",
          impact_label: "ADR آگاہی اور پالیسی اصلاحات کو فروغ دینا"
        },
        about: {
          years: "سال",
          stat_label: "میڈیشن میں عمدگی کو فروغ دینا",
          tab1_title: "PMA کے بارے میں",
          tab1_text: "PMA (پاکستان میڈیٹرز ایسوسی ایشن) ایک خودمختار ادارہ ہے جو پاکستان بھر میں میڈیشن اور متبادل تنازعات کے حل (ADR) کے ذریعے پرامن حل کو فروغ دینے کے لیے قائم کیا گیا ہے۔ بین الاقوامی طور پر تسلیم شدہ ثالثوں اور ٹرینرز کے ساتھ، PMA میڈیشن کی آگاہی، پیشہ ورانہ تربیت، ادارہ جاتی ADR کی ترقی اور پالیسی سازی کے لیے سرگرم عمل ہے۔ ہمارا مشن ایسے قابل رسائی، خفیہ اور مؤثر تنازعات کے حل کے نظام بنانا ہے جو افراد، کاروبار، تنظیموں اور برادریوں کو تعلقات برقرار رکھتے ہوئے اور غیر ضروری قانونی چارہ جوئی کو کم کرتے ہوئے تنازعات کو حل کرنے میں مدد کرتے ہیں۔",
          tab2_title: "ہمارا وژن",
          tab2_text: "میڈیشن کو پاکستان میں تنازعات کے حل کے لیے معروف اور سب سے قابل اعتماد طریقہ بنانا، جس سے تعمیری مکالمے، باہمی مفاہمت اور پرامن بقائے باہمی کی ثقافت کو فروغ ملے۔",
          tab3_title: "ہمارا مشن",
          tab3_mission1: "میڈیشن کو ایک قابل رسائی اور مؤثر تنازعات کے حل کے طریقہ کار کے طور پر فروغ دینا",
          tab3_mission2: "بین الاقوامی معیارات کے مطابق ثالثوں کی تربیت اور منظوری دینا",
          tab3_mission3: "عدالتوں، سرکاری اداروں اور نجی شعبوں کے ساتھ تعاون کرنا",
          tab3_mission4: "معاشرے میں میڈیشن کے فوائد کے بارے میں آگاہی پیدا کرنا",
          tab4_title: "ہمارا اثر",
          tab4_text1: "PMA نے سینکڑوں وکلاء، ججوں اور پیشہ ور افراد کو کامیابی سے تربیت دی ہے اور پاکستان میں عدالت سے منسلک میڈیشن کے اقدامات کو فروغ دینے میں اہم کردار ادا کیا ہے۔",
          tab4_text2: "ہم میڈیشن کو تنازعات کے حل کے ایک پائیدار نظام کے طور پر مضبوط کرنے کے لیے عدلیہ اور اسٹیک ہولڈرز کے ساتھ مل کر کام کر رہے ہیں۔",
          info_phone_label: "ہماری خدمات درکار ہیں؟",
          info_phone_val: "کال کریں: +92 300 000 0000",
          info_hours_label: "کام کے اوقات",
          info_hours_val: "پیر تا جمعہ (9 بجے سے 5 بجے تک)",
          info_email_label: "ہمیں ای میل کریں",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "میڈیشن (مصالحت) کیا ہے؟",
          text1: "میڈیشن ایک رضاکارانہ، خفیہ اور منظم عمل ہے جہاں ایک غیر جانبدار ثالث فریقین کو بات چیت کرنے، ایک دوسرے کے نقطہ نظر کو سمجھنے اور باہمی طور پر قابل قبول حل تک پہنچنے میں مدد کرتا ہے۔",
          text2: "یہ فریقین کو نتائج طے کرنے کا اختیار دیتا ہے، تعلقات کو برقرار رکھتا ہے اور وقت، خرچ اور ذہنی دباؤ کو بچاتا ہے۔",
          btn: "میڈیشن کا عمل سمجھیں"
        },
        why_choose: {
          title: "PMA کا انتخاب کیوں کریں؟",
          lead: "ہم اخلاقی، مؤثر اور پائیدار ADR حل فراہم کرنے کے لیے بین الاقوامی معیارات کو مقامی سمجھ بوجھ کے ساتھ ملاتے ہیں۔",
          btn: "PMA کے بارے میں مزید جانیں",
          features: {
            f1_title: "بین الاقوامی معیارات", f1_desc: "ہم عالمی سطح پر تسلیم شدہ میڈیشن اصولوں اور طریقوں پر عمل کرتے ہیں۔",
            f2_title: "تجربہ کار اور تصدیق شدہ ثالث", f2_desc: "ہمارے پینل میں انتہائی تربیت یافتہ اور مستند پیشہ ور افراد شامل ہیں۔",
            f3_title: "خفیہ عمل", f3_desc: "آپ کی رازداری ہر مرحلے پر ہماری اولین ترجیح ہے۔",
            f4_title: "تیز اور دوستانہ نتائج", f4_desc: "ہم تنازعات کو مؤثر طریقے سے حل کرنے میں مدد کرتے ہیں۔",
            f5_title: "کم خرچ", f5_desc: "مہنگی اور لمبی قانونی چارہ جوئی کا ایک عملی متبادل۔"
          }
        },
        training: {
          title: "پیشہ ورانہ تربیت اور منظوری",
          text: "PMA وکلاء، کارپوریٹ پیشہ ور افراد، HR ٹیموں، اساتذہ اور خواہشمند ثالثوں کے لیے بین الاقوامی سطح کی میڈیشن ٹریننگ اور پیشہ ورانہ ترقی کے پروگرام فراہم کرتا ہے۔",
          card_text: "ہمارے تربیتی پروگرام بین الاقوامی معیارات کے مطابق ہیں اور پیشہ ور افراد کو مؤثر، اخلاقی اور باصلاحیت ثالث بننے کے قابل بناتے ہیں۔",
          btn: "تربیتی پروگرام دیکھیں"
        },
        services: {
          title: "ہماری بنیادی خدمات",
          list: {
            s1: { title: "کمرشل اور کارپوریٹ میڈیشن", desc: "کاروباری اور تجارتی تنازعات کا مؤثر حل۔" },
            s2: { title: "عدالتی میڈیشن", desc: "عدالت سے منسلک معاملات کے لیے ADR سپورٹ۔" },
            s3: { title: "خاندانی اور کمیونٹی میڈیشن", desc: "خاندانی تنازعات کا پرامن حل۔" },
            s4: { title: "کام کی جگہ کے تنازعات", desc: "دفتر کے اندرونی تنازعات کو حل کرنا۔" },
            s5: { title: "IMI-تصدیق شدہ ثالث ٹریننگ", desc: "پیشہ ورانہ ثالث سرٹیفیکیشن پروگرام۔" },
            s6: { title: "ورکشاپس اور آگاہی", desc: "ADR آگاہی پیدا کرنے والے تعلیمی سیشن۔" },
            s7: { title: "ادارہ جاتی مشاورتی خدمات", desc: "ADR سسٹمز بنانے میں اداروں کی معاونت۔" }
          }
        },
        leadership: {
          title: "ہماری قیادت سے ملیں",
          roles: { president: "صدر", secretary: "سیکرٹری جنرل", vp_north: "نائب صدر - شمال", vp_south: "نائب صدر - جنوب" }
        },
        stats: {
          s1: { label: "کامیاب میڈیشنز", unit: "+" },
          s2: { label: "کامیاب حل", unit: "%" },
          s3: { label: "100% نجی عمل", value: "خفیہ" },
          s4: { label: "تربیت یافتہ ثالث", value: "مستند" }
        },
        partners: {
          title: "ہمارے پارٹنرز",
          p1: "سندھ ہائی کورٹ",
          p2: "سرکاری ادارے",
          p3: "انٹرنیشنل میڈیشن انسٹی ٹیوٹ"
        },
        cta: {
          title: "آئیں بات کریں، کیونکہ ہم کر سکتے ہیں۔",
          subtitle: "کیا آپ تنازعہ پرامن طریقے سے حل کرنا چاہتے ہیں؟ یا مصدقہ ثالث بننا چاہتے ہیں؟ آج ہی رابطہ کریں",
          btn1: "مفت مشاورت",
          btn2: "مصدقہ ثالث بنیں",
          link: "ہماری ٹیم سے فوری چیٹ کریں"
        },
        footer: {
          brand: {
            tagline: "پاکستان بھر میں مکالمے، مصالحت اور باہمی افہام و تفہیم کے ذریعے پرامن حل کو فروغ دینا۔",
            logo_alt: "پاکستان میڈیٹرز ایسوسی ایشن"
          },
          quick_links: {
            title: "فوری لنکس",
            items: [
              { label: "گھر", link: "index.html" },
              { label: "PMA کے بارے میں", link: "about.html" },
              { label: "میڈیشن (مصالحت)", link: "mediation.html" },
              { label: "خدمات", link: "services.html" },
              { label: "تربیت", link: "training.html" },
              { label: "قیادت", link: "leadership.html" },
              { label: "وسائل", link: "resources.html" },
              { label: "ایونٹس", link: "events.html" },
              { label: "رابطہ کریں", link: "contact.html" }
            ]
          },
          services: {
            title: "ہماری خدمات",
            items: [
              "میڈیشن کی خدمات",
              "IMI سے تصدیق شدہ میڈیٹر ٹریننگ",
              "ADR ورکشاپس اور آگاہی سیشن",
              "ادارہ جاتی ADR مشاورتی خدمات",
              "پالیسی اور میڈیشن ایڈوکیسی"
            ]
          },
          contact: {
            title: "رابطہ کی معلومات",
            hours: "پیر تا جمعہ (صبح 9 بجے سے شام 5 بجے تک)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 پاکستان میڈیٹرز ایسوسی ایشن (PMA)۔ جملہ حقوق محفوظ ہیں۔",
            legal: [
              { label: "اکثر پوچھے گئے سوالات (FAQ's)", link: "faq.html" },
              { label: "پرائیویسی پالیسی", link: "privacy-policy.html" },
              { label: "شکایت اور اپیل پالیسی", link: "complaint-policy.html" },
              { label: "شرائط و ضوابط", link: "terms.html" }
            ]
          }
        }
      }
    },
    ar: {
      translation: {
        nav: {
          home: "الرئيسية",
          about: "عن PMA",
          mediation: "الوساطة",
          services: "الخدمات",
          training: "التدريب",
          leadership: "القيادة",
          resources: "الموارد",
          events: "الأحداث",
          contact: "اتصل بنا",
          membership: "كن عضواً"
        },
        hero: {
          title_part1: "تعزيز الحل السلمي",
          title_part2: "من خلال الحوار والتفاهم والاحترام",
          description1: "نحن ندعم الوساطة كبديل فعال وكفؤ وسري وتعاوني للتقاضي التقليدي.",
          description2: "من خلال الحوار المنظم والتسهيل المهني، نساعد الأفراد والعائلات والشركات والمؤسسات على حل النزاعات بشكل ودي — مع الحفاظ على العلاقات وتقليل الوقت والتكلفة والضغط النفسي.",
          btn_consult: "طلب استشارة مجانية",
          btn_training: "استكشف برامج التدريب"
        },
        features: {
          confidential_title: "سري وخاص",
          confidential_desc: "تظل مناقشاتك آمنة ومحمية بالكامل.",
          faster_title: "حل أسرع",
          faster_desc: "حل النزاعات في أيام أو أسابيع بدلاً من أشهر.",
          cost_title: "حل فعال من حيث التكلفة",
          cost_desc: "تجنب رسوم المحاماة الباهظة والدعاوى القانونية الطويلة."
        },
        glance: {
          title: "PMA لمحة عامة",
          founded: "تأسس 2013–14",
          founded_label: "أول جمعية للوساطة في باكستان",
          mediations: "2000+",
          mediations_label: "حالات الوساطة والتسهيل الناجحة",
          mediators: "100+",
          mediators_label: "وسطاء معتمدون في جميع أنحاء باكستان",
          training: "100+",
          training_label: "برامج تدريبية مقدمة",
          impact: "تأثير وطني",
          impact_label: "تعزيز الوعي بالوسائل البديلة وإصلاح السياسات"
        },
        about: {
          years: "سنوات",
          stat_label: "تعزيز التميز في الوساطة",
          tab1_title: "عن PMA",
          tab1_text: "PMA (جمعية الوسطاء الباكستانية) هي مؤسسة مستقلة تم تأسيسها لتعزيز حل النزاعات السلمية من خلال الوساطة والحل البديل للنزاعات (ADR) في جميع أنحاء باكستان.",
          tab2_title: "رؤيتنا",
          tab2_text: "في باكستان بناء الوساطة كأهم وأكثر الطرق الموثوقة لحل النزاعات، مع تعزيز ثقافة الحوار البناء والتفاهم المتبادل والتعايش السلمي.",
          tab3_title: "مهمتنا",
          tab3_mission1: "تعزيز الوساطة كآلية يسهل الوصول إليها وفعالة لحل النزاعات",
          tab3_mission2: "تدريب واعتماد الوسطاء وفقاً للمعايير الدولية",
          tab3_mission3: "التعاون مع المحاكم والمؤسسات الحكومية والقطاع الخاص",
          tab3_mission4: "رفع الوعي بفوائد الوساطة في جميع أنحاء المجتمع",
          tab4_title: "تأثيرنا",
          tab4_text1: "نجحت PMA في تدريب مئات المحامين والقضاة والمتخصصين وقامت بدور رئيسي في تعزيز مبادرات الوساطة المرتبطة بالمحاكم في باكستان.",
          tab4_text2: "نحن نستمر في العمل عن كثب مع السلطة القضائية والمصالح الفاعلة لتعزيز الوساطة كنظام حل نزاعات مستدام.",
          info_phone_label: "هل تحتاج إلى خدماتنا؟",
          info_phone_val: "اتصل: +92 300 000 0000",
          info_hours_label: "ساعات العمل",
          info_hours_val: "الاثنين - الجمعة (9 صباحاً إلى 5 مساءً)",
          info_email_label: "راسلنا بالبريد الإلكتروني",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "ما هي الوساطة؟",
          text1: "الوساطة هي عملية طوعية وسرية ومنظمة حيث يساعد وسيط محايد الأطراف في النزاع على التواصل وفهم وجهات نظر بعضهم البعض والوصول إلى حل مقبول للطرفين.",
          text2: "إنها تمكن الأطراف من تشكيل النتيجة، وتحافظ على العلاقات، وتوفر الوقت والتكلفة والتوتر العاطفي.",
          btn: "فهم عملية الوساطة"
        },
        why_choose: {
          title: "لماذا تختار PMA؟",
          lead: "نحن نجمع بين المعايير الدولية والفهم المحلي لتقديم حلول تسوية منازعات بديلة أخلاقية وفعالة ومستدامة.",
          btn: "تعرف على المزيد عن PMA",
          features: {
            f1_title: "المعايير الدولية", f1_desc: "نتبع مبادئ وممارسات الوساطة المعترف بها عالمياً.",
            f2_title: "وسطاء ذوو خبرة ومعتمدون", f2_desc: "يضم فريقنا متخصصين مدربين تدريباً عالياً.",
            f3_title: "عملية سرية", f3_desc: "خصوصيتك هي أولويتنا القصوى في كل مرحلة.",
            f4_title: "نتائج أسرع وودية", f4_desc: "نساعد في حل النزاعات بكفاءة وفعالية.",
            f5_title: "فعالة من حيث التكلفة", f5_desc: "بديل عملي للتقاضي المكلف والطويل."
          }
        },
        training: {
          title: "التدريب المهني والاعتماد",
          text: "توفر PMA تدريبًا على الوساطة وبرامج تطوير مهني مصممة للمحامين والمهنيين والفرق والمدربين الطموحين وفق المعايير الدولية.",
          card_text: "برامجنا التدريبية تلبي المعايير الدولية وتمكن المهنيين من أن يصبحوا وسطاء فعالين وأخلاقيين.",
          btn: "استكشف برامج التدريب"
        },
        services: {
          title: "خدماتنا الأساسية",
          list: {
            s1: { title: "الوساطة التجارية والشركات", desc: "حل النزاعات التجارية والتعاقدية بكفاءة." },
            s2: { title: "الوساطة المرتبطة بالمحاكم", desc: "دعم تسوية المنازعات للقضايا المرتبطة بالمحاكم." },
            s3: { title: "الوساطة الأسرية والمجتمعية", desc: "مساعدة العائلات على حل النزاعات سلمياً." },
            s4: { title: "نزاعات العمل والتنظيم", desc: "معالجة الصراعات الداخلية في مكان العمل." },
            s5: { title: "تدريب الوسطاء المعتمد من IMI", desc: "برامج تطوير المهارات والاعتماد." },
            s6: { title: "ورش العمل وبرامج التوعية", desc: "جلسات تعليمية لتعزيز ثقافة حل النزاعات." },
            s7: { title: "الاستشارات المؤسسية والسياسات", desc: "دعم المؤسسات في بناء أنظمة تسوية المنازعات." }
          }
        },
        leadership: {
          title: "تعرف على قيادتنا",
          roles: { president: "الرئيس", secretary: "الأمين العام", vp_north: "نائب الرئيس - الشمال", vp_south: "نائب الرئيس - الجنوب" }
        },
        stats: {
          s1: { label: "وساطات ميسرة", unit: "+" },
          s2: { label: "حلول ناجحة", unit: "%" },
          s3: { label: "عملية خاصة 100%", value: "سري" },
          s4: { label: "وسطاء مدربون", value: "معتمد" }
        },
        partners: {
          title: "شركاؤنا",
          p1: "محكمة السند العليا",
          p2: "المؤسسات الحكومية",
          p3: "المعهد الدولي للوساطة"
        },
        cta: {
          title: "لنتحدث لأننا نستطيع.",
          subtitle: "هل أنت مستعد لحل نزاعك سلمياً؟ أو مهتم بأن تصبح وسيطاً معتمداً؟ اتصل بنا اليوم",
          btn1: "طلب استشارة مجانية",
          btn2: "كن وسيطاً معتمداً",
          link: "تحدث فوراً مع فريقنا"
        },
        footer: {
          brand: {
            tagline: "تعزيز الحلول السلمية من خلال الحوار والوساطة والتفاهم المتبادل في جميع أنحاء باكستان.",
            logo_alt: "الجمعية الباكستانية للوسطاء"
          },
          quick_links: {
            title: "روابط سريعة",
            items: [
              { label: "الرئيسية", link: "index.html" },
              { label: "عن PMA", link: "about.html" },
              { label: "الوساطة", link: "mediation.html" },
              { label: "الخدمات", link: "services.html" },
              { label: "التدريب", link: "training.html" },
              { label: "القيادة", link: "leadership.html" },
              { label: "الموارد", link: "resources.html" },
              { label: "الفعاليات", link: "events.html" },
              { label: "اتصل بنا", link: "contact.html" }
            ]
          },
          services: {
            title: "خدماتنا",
            items: [
              "خدمات الوساطة",
              "تدريب الوسطاء المعتمد من IMI",
              "ورش عمل وجلسات توعية حول ADR",
              "استشارات مؤسسية في ADR",
              "السياسات ودعم الوساطة"
            ]
          },
          contact: {
            title: "معلومات الاتصال",
            hours: "من الاثنين إلى الجمعة (9 صباحاً - 5 مساءً)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 الجمعية الباكستانية للوسطاء (PMA). جميع الحقوق محفوظة.",
            legal: [
              { label: "الأسئلة الشائعة (FAQ's)", link: "faq.html" },
              { label: "سياسة الخصوصية", link: "privacy-policy.html" },
              { label: "سياسة الشكاوى والاستئناف", link: "complaint-policy.html" },
              { label: "الشروط والأحكام", link: "terms.html" }
            ]
          }
        }
      }
    },
    ch: {
      translation: {
        nav: {
          home: "首页",
          about: "关于PMA",
          mediation: "调解",
          services: "服务",
          training: "培训",
          leadership: "领导力",
          resources: "资源",
          events: "活动",
          contact: "联系我们",
          membership: "成为会员"
        },
        hero: {
          title_part1: "促进和平解决",
          title_part2: "通过对话、理解和尊重",
          description1: "我们推崇调解作为对传统诉讼的有效、高效、保密和协作的替代方案。",
          description2: "通过结构化的对话和专业的便利化，我们帮助个人、家庭、企业和机构友好地解决冲突——同时保护关系并减少时间、成本和压力。",
          btn_consult: "申请免费咨询",
          btn_training: "探索培训项目"
        },
        features: {
          confidential_title: "保密且私密",
          confidential_desc: "您的讨论保持完全安全和保护。",
          faster_title: "更快的解决方案",
          faster_desc: "在几天或几周而不是几个月内解决争议。",
          cost_title: "具有成本效益的解决方案",
          cost_desc: "避免昂贵的法律费用和冗长的法律诉讼。"
        },
        glance: {
          title: "PMA一览",
          founded: "成立于2013-14年",
          founded_label: "巴基斯坦首家调解协会",
          mediations: "2000+",
          mediations_label: "成功的调解和便利化案件",
          mediators: "100+",
          mediators_label: "遍布巴基斯坦的认证调解员",
          training: "100+",
          training_label: "已提供的培训项目",
          impact: "国家影响",
          impact_label: "推进替代纠纷解决意识和政策改革"
        },
        about: {
          years: "年份",
          stat_label: "促进调解卓越",
          tab1_title: "关于PMA",
          tab1_text: "PMA（巴基斯坦调解员协会）是一个独立机构，致力于在巴基斯坦推广通过调解和替代纠纷解决（ADR）的和平纠纷解决。",
          tab2_title: "我们的愿景",
          tab2_text: "在巴基斯坦建立调解作为纠纷解决的主要和最可信任的方法，促进建设性对话、相互理解和和平共处的文化。",
          tab3_title: "我们的使命",
          tab3_mission1: "推崇调解作为一种易获取和有效的纠纷解决机制",
          tab3_mission2: "根据国际标准培训和认证调解员",
          tab3_mission3: "与法院、政府机构和私营部门合作",
          tab3_mission4: "提高社会对调解益处的认识",
          tab4_title: "我们的影响",
          tab4_text1: "PMA已成功培训了数百名律师、法官和专业人士，并在推动巴基斯坦与法院挂钩的调解举措中发挥了关键作用。",
          tab4_text2: "我们继续与司法部门和利益相关者密切合作，以加强调解作为一个可持续的纠纷解决系统。",
          info_phone_label: "需要我们的服务吗？",
          info_phone_val: "致电：+92 300 000 0000",
          info_hours_label: "营业时间",
          info_hours_val: "星期一至星期五（上午9点至下午5点）",
          info_email_label: "给我们发邮件",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "什么是调解？",
          text1: "调解是一种自愿、保密且结构化的过程，由中立的调解员帮助冲突双方进行沟通，理解彼此的观点，并达成双方都能接受的解决方案。",
          text2: "它赋予当事人掌控结果的能力，维护了关系，并节省了时间、成本和情感压力。",
          btn: "了解调解流程"
        },
        why_choose: {
          title: "为什么选择 PMA？",
          lead: "我们将国际标准与本地理解相结合，提供合乎道德、有效且可持续的替代性争议解决 (ADR) 方案。",
          btn: "了解关于 PMA 的更多信息",
          features: {
            f1_title: "国际标准", f1_desc: "我们遵循全球认可的调解原则和实践。",
            f2_title: "经验丰富的认证调解员", f2_desc: "我们的团队拥有受过高度培训的认证专业人员。",
            f3_title: "保密流程", f3_desc: "在每一个阶段，您的隐私都是我们的重中之重。",
            f4_title: "更快的友好结果", f4_desc: "我们帮助高效、有效地解决争议。",
            f5_title: "经济高效", f5_desc: "昂贵且漫长诉讼的实用替代方案。"
          }
        },
        training: {
          title: "专业培训与认证",
          text: "PMA 提供与国际接轨的调解培训及职业发展项目，专为律师、企业专业人士、人力资源团队和有抱负的调解员设计。",
          card_text: "我们的培训项目符合国际标准，使专业人士能够成为高效、合乎道德且具备全球胜任力的调解员。",
          btn: "探索培训课程"
        },
        services: {
          title: "我们的核心服务",
          list: {
            s1: { title: "商业与企业调解", desc: "高效解决业务、合伙及合同争议。" },
            s2: { title: "法院引荐调解", desc: "为法院相关事项提供 ADR 支持。" },
            s3: { title: "家庭与社区调解", desc: "帮助家庭和社区和平解决冲突。" },
            s4: { title: "职场与组织纠纷", desc: "处理职场内部冲突和组织不和。" },
            s5: { title: "IMI 认证调解员培训", desc: "专业调解员认证与技能发展项目。" },
            s6: { title: "研讨会与宣传项目", desc: "推广 ADR 意识与冲突解决文化的教育课程。" },
            s7: { title: "制度与政策咨询", desc: "支持机构构建 ADR 系统与调解框架。" }
          }
        },
        leadership: {
          title: "认识我们的领导团队",
          roles: { president: "主席", secretary: "秘书长", vp_north: "副主席（北方）", vp_south: "副主席（南方）" }
        },
        stats: {
          s1: { label: "已协调调解", unit: "+" },
          s2: { label: "成功解决率", unit: "%" },
          s3: { label: "100% 私密流程", value: "保密" },
          s4: { label: "受训调解员", value: "已认证" }
        },
        partners: {
          title: "我们的合作伙伴",
          p1: "信德省高等法院",
          p2: "政府机构",
          p3: "国际调解协会"
        },
        cta: {
          title: "让我们谈谈，因为我们可以。",
          subtitle: "准备好和平解决争端了吗？或者有兴趣成为认证调解员？今天就联系我们",
          btn1: "申请免费咨询",
          btn2: "成为认证调解员",
          link: "与我们的团队即时聊天"
        },
        footer: {
          brand: {
            tagline: "在巴基斯坦全境通过对话、调解和相互理解促进和平解决方案。",
            logo_alt: "巴基斯坦调解员协会"
          },
          quick_links: {
            title: "快速链接",
            items: [
              { label: "首页", link: "index.html" },
              { label: "关于 PMA", link: "about.html" },
              { label: "调解", link: "mediation.html" },
              { label: "服务", link: "services.html" },
              { label: "培训", link: "training.html" },
              { label: "领导团队", link: "leadership.html" },
              { label: "资源", link: "resources.html" },
              { label: "活动", link: "events.html" },
              { label: "联系我们", link: "contact.html" }
            ]
          },
          services: {
            title: "我们的服务",
            items: [
              "调解服务",
              "IMI 认证调解员培训",
              "ADR 研讨会及宣传课程",
              "机构 ADR 咨询",
              "政策与调解倡导"
            ]
          },
          contact: {
            title: "联系信息",
            hours: "周一至周五（上午 9 点至下午 5 点）",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 巴基斯坦调解员协会 (PMA)。版权所有。",
            legal: [
              { label: "常见问题 (FAQ's)", link: "faq.html" },
              { label: "隐私政策", link: "privacy-policy.html" },
              { label: "投诉与申诉政策", link: "complaint-policy.html" },
              { label: "条款与条件", link: "terms.html" }
            ]
          }
        }
      }
    },
    psh: {
      translation: {
        nav: {
          home: "کور",
          about: "د PMA په اړه",
          mediation: "غږولنه",
          services: "خدمات",
          training: "روزنه",
          leadership: "مشرتابه",
          resources: "سرچینې",
          events: "پیښې",
          contact: "زما سره اړیکه",
          membership: "غړی شئ"
        },
        hero: {
          title_part1: "د آرام حل ته لاره کول",
          title_part2: "د مکالمې، پوهاوي او احترام له لارې",
          description1: "موږ د غږولنې د فعالې، موثره، محرمانې او همکارانه بدیل لپاره تشویق کوو.",
          description2: "د منظم مکالمې او حرفه ورانه سهولت له لارې، موږ افرادو، کورنیو، کاروبارونو او ادارو کې د نزاعاتو حل کې مرسته کوو.",
          btn_consult: "د وړیا مشورې غوښتنه کړئ",
          btn_training: "روزنې برنامې وګورئ"
        },
        features: {
          confidential_title: "محرمانه او نجی",
          confidential_desc: "ستاسو مکالمې بشپړ امنیت سره ساتل کیږي.",
          faster_title: "چټک حل",
          faster_desc: "نزاعات د مياشتو پرځای د ورځو یا اونیو کې حل کړئ.",
          cost_title: "کم لګښت حل",
          cost_desc: "د مهالو قانوني فیسو او اوږدې عدالتي جگړو څخه ډډ شئ."
        },
        glance: {
          title: "PMA یوهلته",
          founded: "تاسیس 2013–14",
          founded_label: "د افغانستان/پاکستان لومړی غږولنې ټولنه",
          mediations: "2000+",
          mediations_label: "کامیاب غږولنې او سهولت کیسونه",
          mediators: "100+",
          mediators_label: "تصدیق شوي غږولنګران",
          training: "100+",
          training_label: "تسلیم شوې روزنې برنامې",
          impact: "ملي اغیز",
          impact_label: "ADR پوهاوي او پالیسي اصلاحات"
        },
        about: {
          years: "کالونه",
          stat_label: "د غږولنې درې کولو پروات",
          tab1_title: "د PMA په اړه",
          tab1_text: "PMA د غږولنې او متبادل نزاع حل (ADR) له لارې د آرام حل کو لاره کولو لپاره تاسیس شوي خپلواک ادارې دې.",
          tab2_title: "زموږ نظریه",
          tab2_text: "غږولنه د پاکستان کې د نزاع حل کې مشهور ترین او ویره وړ طریقه وساتل.",
          tab3_title: "زموږ مشن",
          tab3_mission1: "غږولنه د رسیدونکې او موثره نزاع حل میکانیزم لپاره پروات کول",
          tab3_mission2: "بین الاقوامي معیاراتو سره غږولنګرانو کو روزنه او پذیرفتول",
          tab3_mission3: "عدالتونو، حکومتي ادارو او شخصي سکتورونو سره همکاري",
          tab3_mission4: "د غږولنې فایدو په اړه د ټولنې میږ آگاهي لپاره پروات",
          tab4_title: "زموږ اغیز",
          tab4_text1: "PMA په کامیابۍ سره د قانون پوهانو، قاضیانو او متخصصینو د سوو کس کو روزنه کړې دې.",
          tab4_text2: "موږ د عدالت سره او متعلقه شخصیتونو سره کار کوو ترم غږولنه د پایداره نزاع حل سیسټم لپاره پیاوړې کړو.",
          info_phone_label: "د زموږ خدمات ته ضرورت دی؟",
          info_phone_val: "زنګ کړئ: +92 300 000 0000",
          info_hours_label: "کاري وخت",
          info_hours_val: "دوشنبه-جمعه (9 بجې تر 5 بجې)",
          info_email_label: "زما ته ای میل کړئ",
          info_email_val: "info@pma.org.pk"        },
        mediation: {
          title: "منځګړیتوب څه شی دی؟",
          text1: "منځګړیتوب یو رضاکارانه، محرم او منظم بهیر دی چیرې چې یو بې طرفه منځګړی د شخړې ښکیلو اړخونو سره مرسته کوي ترڅو خبرې وکړي، یو د بل لید درک کړي او یو داسې حل ته ورسیږي چې دواړو ته د منلو وړ وي.",
          text2: "دا اړخونه ځواکمن کوي چې د پایلو په جوړولو کې برخه واخلي، اړیکې وساتي او وخت، لګښت او فشار کم کړي.",
          btn: "د منځګړیتوب پروسه وپېژنئ"
        },
        why_choose: {
          title: "ولې PMA انتخاب کړئ؟",
          lead: "موږ د اخلاقي، اغیزمنو او پایښت لرونکو ADR حلونو وړاندې کولو لپاره نړیوال معیارونه د محلي پوهاوي سره یوځای کوو.",
          btn: "د PMA په اړه نور معلومات",
          features: {
            f1_title: "نړیوال معیارونه", f1_desc: "موږ په نړیواله کچه منل شوي اصول تعقیب کوو.",
            f2_title: "تجربه کار او تصدیق شوي منځګړي", f2_desc: "زموږ په پینل کې ماهر مسلکي کسان شتون لري.",
            f3_title: "محرمه پروسه", f3_desc: "ستاسو محرمیت زموږ لومړیتوب دی.",
            f4_title: "ګړندي او دوستانه پایلې", f4_desc: "موږ د شخړو په اغیزمنه حل کې مرسته کوو.",
            f5_title: "کم لګښت", f5_desc: "د ګران بیه او اوږدو قضیو لپاره عملي بدیل."
          }
        },
        training: {
          title: "مسلکي روزنه او تصدیق",
          text: "PMA د وکیلانو، کارپوریټ مسلکي کسانو، او منځګړو لپاره د نړیوالو معیارونو سره سم روزنیز پروګرامونه وړاندې کوي.",
          card_text: "زموږ روزنیز پروګرامونه مسلکي کسان د دې وړ کوي چې اغیزمن او اخلاقي منځګړي شي.",
          btn: "روزنیز پروګرامونه وګورئ"
        },
        services: {
          title: "زموږ اصلي خدمات",
          list: {
            s1: { title: "سوداګریز او کارپوریټ منځګړیتوب", desc: "د سوداګریزو شخړو اغیزمن حل." },
            s2: { title: "عدالتي منځګړیتوب", desc: "د محکمو پورې اړوند قضیو لپاره ملاتړ." },
            s3: { title: "خانوادګي او ټولنیز منځګړیتوب", desc: "د کورنیو شخړو سوله ایز حل." },
            s4: { title: "د کارځای شخړې", desc: "د کارځای د داخلي شخړو حل." },
            s5: { title: "IMI-تصدیق شوې روزنه", desc: "مسلکي روزنیز پروګرامونه." },
            s6: { title: "ورکشاپونه او پوهاوی", desc: "د ADR په اړه تعلیمي غونډې." },
            s7: { title: "اداراتي مشورتي خدمات", desc: "د ADR سیسټمونو په جوړولو کې مرسته." }
          }        },
        leadership: {
          title: "زموږ د مشرتابه سره وپیژنئ",
          roles: { president: "رئیس", secretary: "عمومي سکرتر", vp_north: "مرستیال رئیس - شمال", vp_south: "مرستیال رئیس - جنوب" }
        },
        stats: {
          s1: { label: "ترسره شوي منځګړیتوبونه", unit: "+" },
          s2: { label: "کامیاب حل", unit: "%" },
          s3: { label: "100% خصوصي پروسه", value: "محرم" },
          s4: { label: "روزنه لیدلي منځګړي", value: "تصدیق شوي" }
        },
        partners: {
          title: "زموږ شریکان",
          p1: "سندھ عالي محکمه",
          p2: "حکومتي ادارې",
          p3: "نړیوال منځګړیتوب انسټیټیوټ"
        },
        cta: {
          title: "راځئ خبرې وکړو، ځکه موږ کولی شو.",
          subtitle: "ایا غواړئ خپلې شخړې په سوله ایزه توګه حل کړئ؟ یا غواړئ یو تصدیق شوی منځګړی شئ؟ نن له موږ سره اړیکه ونیسئ",
          btn1: "وړیا مشوره",
          btn2: "یو تصدیق شوی منځګړی شئ",
          link: "زموږ ټیم سره فوری چیټ وکړئ"
        },
        footer: {
          brand: {
            tagline: "د پاکستان په کچه د خبرو اترو، منځګړیتوب او متقابل تفاهم له لارې د سوله ایزو حلونو هڅول.",
            logo_alt: "د پاکستان منځګړو ټولنه"
          },
          quick_links: {
            title: "چټک لینکونه",
            items: [
              { label: "کور پاڼه", link: "index.html" },
              { label: "د PMA په اړه", link: "about.html" },
              { label: "منځګړیتوب", link: "mediation.html" },
              { label: "خدمتونه", link: "services.html" },
              { label: "روزنه", link: "training.html" },
              { label: "مشرتابه", link: "leadership.html" },
              { label: "سرچینې", link: "resources.html" },
              { label: "پیښې", link: "events.html" },
              { label: "اړیکه", link: "contact.html" }
            ]
          },
          services: {
            title: "زموږ خدمتونه",
            items: [
              "د منځګړیتوب خدمتونه",
              "د IMI لخوا تصدیق شوې روزنه",
              "د ADR ورکشاپونه او د پوهاوي غونډې",
              "اداراتي ADR مشورتي خدمتونه",
              "پالیسي او د منځګړیتوب ملاتړ"
            ]
          },
          contact: {
            title: "د اړیکې معلومات",
            hours: "د دوشنبې نه تر جمعې (د سهار 9 بجو نه د ماښام تر 5 بجو)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 د پاکستان منځګړو ټولنه (PMA). ټول حقوق خوندي دي.",
            legal: [
              { label: "عامې پوښتنې (FAQ's)", link: "faq.html" },
              { label: "د محرمیت تګلاره", link: "privacy-policy.html" },
              { label: "د شکایت او اپیل تګلاره", link: "complaint-policy.html" },
              { label: "شرایط او ضوابط", link: "terms.html" }
            ]
          }
        }
      }
    },
    sd: {
      translation: {
        nav: {
          home: "گھر",
          about: "PMA بابت",
          mediation: "ثالثت",
          services: "خدمتون",
          training: "تربيت",
          leadership: "قيادت",
          resources: "وسيلا",
          events: "تقريبن",
          contact: "اسان سان رابطو",
          membership: "ميمبر ٿي وڃو"
        },
        hero: {
          title_part1: "پرسرار حل کي فروغ",
          title_part2: "گفتگو، سمجھ ۽ احترام ذريعي",
          description1: "اسان ثالثت کي روايتي قانوني نقصان لاء موثر، معقول، خفيہ ۽ تعاون جو بيڪار دي.",
          description2: "منظم گفتگو ۽ پروفيشنل سهولت ذريعي، اسان ماڻهن، خاندانن، ڪاروباري ۽ ادارن کي نزاع حل ڪرڻ ۾ مدد ڪريون ٿا.",
          btn_consult: "مفت صلاح و مشورو جي درخواست ڪريو",
          btn_training: "تربيتي پروگرام ڏسو"
        },
        features: {
          confidential_title: "خفيہ ۽ نجي",
          confidential_desc: "توهان جي گفتگو مڪمل محفوظ رهندي آهي.",
          faster_title: "تيز حل",
          faster_desc: "نزاعات کي مهينن جي بجائے ڏينهن ۽ هفتينن ۾ حل ڪريو.",
          cost_title: "سستو حل",
          cost_desc: "مهنگي قانوني فيس ۽ ڊگهي عدالتي لڙائين کان بچو."
        },
        glance: {
          title: "PMA هڪ نظر ۾",
          founded: "قائم 2013–14",
          founded_label: "پاڪستان جي پھريون ثالثت انجمن",
          mediations: "2000+",
          mediations_label: "ڪامياب ثالثت ۽ سهولت ڪيسز",
          mediators: "100+",
          mediators_label: "تصديق شدہ ثالث پاڪستان ڀر",
          training: "100+",
          training_label: "تربيتي پروگرام فراهم ڪيا ويا",
          impact: "ملي اثر",
          impact_label: "ADR شعور ۽ پاليسي اصلاح"
        },
        about: {
          years: "سال",
          stat_label: "ثالثت جي بھترين کي فروغ",
          tab1_title: "PMA بابت",
          tab1_text: "PMA (پاڪستان ثالثن جي انجمن) هڪ آزاد ادارو آهي جو پاڪستان ڀر ثالثت ۽ متبادل نزاع حل (ADR) ذريعي پرسرار حل کي فروغ ڏيڻ لاء قائم ڪيو ويو آهي.",
          tab2_title: "اسان جو نظريو",
          tab2_text: "ثالثت کي پاڪستان ۾ نزاع حل کے اهم ۽ قابل اعتماد طريقو بڻائڻ.",
          tab3_title: "اسان جو مشن",
          tab3_mission1: "ثالثت کي رسائي پذير ۽ موثر نزاع حل ميکانزم لاء فروغ ڏيڻ",
          tab3_mission2: "بين الاقوامي معيارن جي مطابق ثالثن کي تربيت ۽ تسليم ڪرڻ",
          tab3_mission3: "عدالتن، حڪومتي ادارن ۽ نجي شعبن سان تعاون",
          tab3_mission4: "ثالثت جي فوائد بابت معاشري ۾ شعور وڌائڻ",
          tab4_title: "اسان جو اثر",
          tab4_text1: "PMA ڪاميابيء سان سيڪڙن وڪيلن، ججن ۽ پروفيشنلن کي تربيت ڏني آهي.",
          tab4_text2: "اسان عدالت ۽ اسٹيڪ هولڈرز سان ملي ثالثت کي پائيدار نزاع حل نظام لاء مضبوط ڪرڻ ۾ ڪم ڪري ٿا.",
          info_phone_label: "اسان جي خدمتون درڪار آهن؟",
          info_phone_val: "ڪال ڪريو: +92 300 000 0000",
          info_hours_label: "ڪم جي وقت",
          info_hours_val: "سوموار-جمعو (9 صبح تي 5 شام)",
          info_email_label: "اسان کي ای میل ڪريو",
          info_email_val: "info@pma.org.pk"        },
        mediation: {
          title: "ميڊئيشن (مصالحت) ڇا آهي؟",
          text1: "ميڊئيشن هڪ رضاکارانه، رازدارانه ۽ منظم عمل آهي جتي هڪ غير جانبدار ثالث ڌرين کي ڳالهين ڪرڻ، هڪ ٻئي جي نقطي نظر کي سمجهڻ ۽ باهمي طور قبول جوڳي حل تائين پهچڻ ۾ مدد ڪري ٿو.",
          text2: "اهو ڌرين کي نتيجا طئي ڪرڻ جو اختيار ڏئي ٿو، لاڳاپا برقرار رکي ٿو ۽ وقت، خرچ ۽ ذهني دٻاءُ کي بچائي ٿو.",
          btn: "ميڊئيشن جو عمل سمجهو"
        },
        why_choose: {
          title: "PMA جو انتخاب ڇو ڪجي؟",
          lead: "اسان اخلاقي، اثرائتي ۽ پائيدار ADR حل فراهم ڪرڻ لاءِ بين الاقوامي معيارن کي مقامي سمجهه سان ملائيون ٿا.",
          btn: "PMA بابت وڌيڪ ڄاڻو",
          features: {
            f1_title: "بين الاقوامي معيار", f1_desc: "اسان عالمي سطح تي مڃيل ميڊئيشن اصولن تي عمل ڪريون ٿا.",
            f2_title: "تجربيڪار ۽ تصديق ٿيل ميڊئيٽرز", f2_desc: "اسان جي پينل ۾ اعليٰ تربيت يافته ماهر شامل آهن.",
            f3_title: "رازدارانه عمل", f3_desc: "توهان جي پرائيويسي هر مرحلي تي اسان جي اولين ترجيح آهي.",
            f4_title: "تيز ۽ پرامن نتيجا", f4_desc: "اسان تڪرارن کي اثرائتي طريقي سان حل ڪرڻ ۾ مدد ڪريون ٿا.",
            f5_title: "گهٽ خرچ", f5_desc: "مهانگي عدالتي جنگين جو هڪ عملي متبادل."
          }
        },
        training: {
          title: "پيشيوراڻي تربيت ۽ تصديق",
          text: "PMA وڪيلن، ڪارپوريٽ ماهرن، HR ٽيمن ۽ استادن لاءِ بين الاقوامي معيار جي ميڊئيشن ٽريننگ ۽ پيشيوراڻي ترقي جا پروگرام مهيا ڪري ٿو.",
          card_text: "اسان جا تربيتي پروگرام بين الاقوامي معيارن مطابق آهن ۽ ماهرن کي باصلاحيت ميڊئيٽر بڻائين ٿا.",
          btn: "تربيتي پروگرام ڏسو"
        },
        services: {
          title: "اسان جون بنيادي خدمتون",
          list: {
            s1: { title: "ڪمرشل ۽ ڪارپوريٽ ميڊئيشن", desc: "ڪاروباري ۽ تجارتي تڪرارن جو حل." },
            s2: { title: "عدالتي ميڊئيشن", desc: "عدالت سان لاڳاپيل معاملن لاءِ ADR سپورٽ." },
            s3: { title: "خانداني ۽ ڪميونٽي ميڊئيشن", desc: "خانداني تڪرارن جو پرامن حل." },
            s4: { title: "ڪم جي جڳهه جا تڪرار", desc: "آفيس جي اندروني معاملن کي حل ڪرڻ." },
            s5: { title: "IMI-تصديق ٿيل ميڊئيٽر ٽريننگ", desc: "پيشيوراڻي سرٽيفڪيشن پروگرام." },
            s6: { title: "ورڪشاپس ۽ شعور", desc: "ADR بابت ڄاڻ ڏيندڙ سيمينار." },
            s7: { title: "اداراتي مشورتي خدمتون", desc: "ADR سسٽم ٺاهڻ ۾ ادارن جي مدد." }
          }        },
        leadership: {
          title: "اسان جي قيادت سان ملو",
          roles: { president: "صدر", secretary: "سيڪريٽري جنرل", vp_north: "نائب صدر - اتر", vp_south: "نائب صدر - ڏکڻ" }
        },
        stats: {
          s1: { label: "ڪامياب ميڊئيشنز", unit: "+" },
          s2: { label: "ڪامياب حل", unit: "%" },
          s3: { label: "100% ذاتي عمل", value: "رازدارانه" },
          s4: { label: "تربيت يافته ميڊئيٽرز", value: "مستند" }
        },
        partners: {
          title: "اسان جا پارٽنرز",
          p1: "سنڌ هاءِ ڪورٽ",
          p2: "سرڪاري ادارا",
          p3: "انٽرنيشنل ميڊئيشن انسٽيٽيوٽ"
        },
        cta: {
          title: "اچو ته ڳالهايون، ڇو ته اسان ڪري سگهون ٿا.",
          subtitle: "ڇا توهان تڪرار پرامن طريقي سان حل ڪرڻ چاهيو ٿا؟ يا مستند ثالث بڻجڻ چاهيو ٿا؟ اڄ ئي رابطو ڪريو",
          btn1: "مفت صلاح مشورو",
          btn2: "مستند ثالث بڻجو",
          link: "اسان جي ٽيم سان فوري چيٽ ڪريو"
        },
        footer: {
          brand: {
            tagline: "پاڪستان ۾ ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي پرامن حل کي هٿي ڏيڻ.",
            logo_alt: "پاڪستان ميڊئيٽرز ايسوسيئيشن"
          },
          quick_links: {
            title: "فوري لنڪس",
            items: [
              { label: "گهر", link: "index.html" },
              { label: "PMA بابت", link: "about.html" },
              { label: "ميڊئيشن (مصالحت)", link: "mediation.html" },
              { label: "خدمتون", link: "services.html" },
              { label: "تربيت", link: "training.html" },
              { label: "قيادت", link: "leadership.html" },
              { label: "وسائل", link: "resources.html" },
              { label: "ايونٽس", link: "events.html" },
              { label: "رابطو ڪريو", link: "contact.html" }
            ]
          },
          services: {
            title: "اسان جون خدمتون",
            items: [
              "ميڊئيشن جون خدمتون",
              "IMI کان تصديق ٿيل ميڊئيٽر ٽريننگ",
              "ADR ورڪشاپس ۽ شعور اجاگر ڪرڻ جا سيشن",
              "اداراتي ADR مشورتي خدمتون",
              "پاليسي ۽ ميڊئيشن ايڊووڪيسي"
            ]
          },
          contact: {
            title: "رابطي جي معلومات",
            hours: "سومر کان جمعو (صبح 9 کان شام 5 وڳي تائين)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA). سڀ حق محفوظ آهن.",
            legal: [
              { label: "اڪثر پڇيا ويندڙ سوال (FAQ's)", link: "faq.html" },
              { label: "پرائيويسي پاليسي", link: "privacy-policy.html" },
              { label: "شڪايت ۽ اپيل پاليسي", link: "complaint-policy.html" },
              { label: "شرطون ۽ ضابطا", link: "terms.html" }
            ]
          }
        }
      }
    }
  };

  // Header selectors translation mapping (automatically translates header elements by URL)
  const headerTranslationMap = [
    { selector: '#mainmenu a[href="index.html"]', key: 'nav.home' },
    { selector: '#mainmenu a[href="about.html"]', key: 'nav.about' },
    { selector: '#mainmenu a[href="mediation.html"]', key: 'nav.mediation' },
    { selector: '#mainmenu a[href="services.html"]', key: 'nav.services' },
    { selector: '#mainmenu a[href="training.html"]', key: 'nav.training' },
    { selector: '#mainmenu a[href="leadership.html"]', key: 'nav.leadership' },
    { selector: '#mainmenu a[href="resources.html"]', key: 'nav.resources' },
    { selector: '#mainmenu a[href="events.html"]', key: 'nav.events' },
    { selector: '#mainmenu a[href="contact.html"]', key: 'nav.contact' },
    { selector: 'a[href="become-a-member.html"]', key: 'nav.membership' }
  ];

  // Helper to load i18next library dynamically from CDN
  function loadI18nextLibrary() {
    return new Promise((resolve, reject) => {
      if (window.i18next) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/i18next@23.11.5/dist/umd/i18next.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load i18next from CDN'));
      document.head.appendChild(script);
    });
  }

  // Fetch JSON files or return fallback resources on CORS / offline errors
  async function loadResources() {
    try {
      // Check if we are running in file:// protocol (which blocks local fetch in most browsers)
      if (window.location.protocol === 'file:') {
        console.warn('PMA Translator: Running on file:// protocol. Fetch is blocked by browser CORS policy. Using built-in fallback translations.');
        return fallbackResources;
      }

      // Fetch all supported language translation JSONs in parallel
      const fetches = await Promise.all(
        SUPPORTED_LANGS.map(lang =>
          fetch(`locals/${lang}/translation.json`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status} for lang: ${lang}`);
              return res.json();
            })
            .then(data => ({ lang, data }))
        )
      );

      // Build the i18next resources object — each JSON file has the lang code as root key
      const resources = {};
      fetches.forEach(({ lang, data }) => {
        // Support both { "en": { ... } } and bare { nav: {...}, ... } formats
        const translationData = data[lang] !== undefined ? data[lang] : data;
        resources[lang] = { translation: translationData };
      });

      return resources;
    } catch (err) {
      console.warn('PMA Translator: Could not load translation JSON files. Using built-in fallback translations. Error:', err.message);
      return fallbackResources;
    }
  }

  // Apply text direction and force layout/scrollbar recalculation to avoid ghost scrollbars
  function applyDirection(isRTL) {
    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
      // Disable scrollbar-gutter in RTL: the stable gutter would be reserved on
      // the inline-start (left) side, creating phantom horizontal scroll space.
      document.documentElement.style.scrollbarGutter = 'auto';
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
      // Restore stable gutter for LTR so the layout width doesn't shift on
      // pages where the vertical scrollbar appears/disappears.
      document.documentElement.style.scrollbarGutter = 'stable';
    }
  }

  // Set document direction and stylesheet based on selected language
  function setLanguageLayout(lang) {
    // RTL languages: Arabic, Urdu, Pashto, Sindhi
    const RTL_LANGS = ['ar', 'ur', 'psh', 'sd'];
    const isRTL = RTL_LANGS.includes(lang);
    const bootstrapSheet = document.getElementById('bootstrap');

    if (bootstrapSheet) {
      const currentHref = bootstrapSheet.getAttribute('href') || '';
      const targetHref = isRTL ? 'css/bootstrap.rtl.min.css' : 'css/bootstrap.min.css';

      if (currentHref !== targetHref) {
        // Lock scrollbar gutter during stylesheet swap to prevent flash
        document.documentElement.classList.add('lang-switching');

        // Create a temporary link element to preload the stylesheet to avoid styling mismatch flashes
        const tempLink = document.createElement('link');
        tempLink.rel = 'stylesheet';
        tempLink.type = 'text/css';
        tempLink.href = targetHref;

        const finalize = function () {
          bootstrapSheet.setAttribute('href', targetHref);
          applyDirection(isRTL);
          tempLink.remove();
          // Release the scroll lock after one frame so the new layout has painted
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.documentElement.classList.remove('lang-switching');
            });
          });
        };

        tempLink.onload = finalize;
        tempLink.onerror = finalize;

        document.head.appendChild(tempLink);
      } else {
        applyDirection(isRTL);
      }
    } else {
      applyDirection(isRTL);
    }
  }

  // Update dropdown UI styling and selection
  function updateLanguageDropdownUI(lang) {
    // Set active class on dropdown option
    document.querySelectorAll('.pma-lang-option').forEach(option => {
      const optionLang = option.getAttribute('data-lang');
      if (optionLang === lang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // Update active label on the dropdown button
    const currentLangEl = document.querySelector('.pma-lang-current');
    if (currentLangEl) {
      const langLabels = {
        'en': 'English',
        'ur': 'اردو',
        'ar': 'العربية',
        'ch': '中文',
        'psh': 'پښتو',
        'sd': 'سنڌي'
      };
      currentLangEl.textContent = langLabels[lang] || 'English';
    }
  }

  // Apply translations to all DOM elements
  function translatePage() {
    // 1. Translate elements with data-i18n attributes (plain text)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translated = window.i18next.t(key);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        // For form fields, update placeholder only
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', translated);
        }
      } else {
        // Plain text — safe for all keys that do not contain HTML markup
        el.textContent = translated;
      }
    });

    // 2. Translate elements with data-i18n-html attributes (innerHTML — allows accent spans)
    //    Used for heading keys that contain <span class="pma-about-heading-accent"> markup.
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = window.i18next.t(key);
    });

    // 3. Translate footer list elements (data-i18n-list)
    //    Supports two list types:
    //    - "link"  → items are objects with { label, link }
    //    - "plain" → items are plain strings
    document.querySelectorAll('[data-i18n-list]').forEach(ul => {
      const key = ul.getAttribute('data-i18n-list');
      const listType = ul.getAttribute('data-i18n-list-type') || 'plain';
      if (!key) return;

      const items = window.i18next.t(key, { returnObjects: true });
      if (!Array.isArray(items) || items.length === 0) return;

      // Determine icon class from existing first <li> (preserve icon style)
      let iconClass = '';
      const firstLi = ul.querySelector('li');
      if (firstLi) {
        const icon = firstLi.querySelector('i');
        if (icon) {
          iconClass = icon.className;
        }
      }

      // Re-render list items
      ul.innerHTML = items.map(item => {
        if (listType === 'link' && item && typeof item === 'object') {
          const label = item.label || '';
          const link = item.link || '#';
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li><a href="${link}">${iconHtml}${label}</a></li>`;
        } else {
          // plain string
          const text = typeof item === 'string' ? item : String(item);
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li><a>${iconHtml}${text}</a></li>`;
        }
      }).join('\n');
    });

    // 4. Translate attribute values (data-i18n-attr-alt → alt attribute)
    document.querySelectorAll('[data-i18n-attr-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-attr-alt');
      if (!key) return;
      el.setAttribute('alt', window.i18next.t(key));
    });

    // 5. Translate header links using automated selector mapping (failsafe fallback)
    headerTranslationMap.forEach(({ selector, key }) => {
      document.querySelectorAll(selector).forEach(el => {
        // Only override text if it does not already have a translation attribute
        if (!el.hasAttribute('data-i18n') && !el.hasAttribute('data-i18n-html')) {
          el.textContent = window.i18next.t(key);
        }
      });
    });
  }

  // Initialize translator
  async function initTranslator() {
    try {
      // 1. Hide unsupported options in dropdown (keep only English and Urdu)
      document.querySelectorAll('.pma-lang-option').forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (!SUPPORTED_LANGS.includes(lang)) {
          option.style.display = 'none';
        }
      });

      // 2. Load i18next script dynamically
      await loadI18nextLibrary();

      // 3. Load translation files
      const resources = await loadResources();

      // 4. Determine initial language (saved preference -> browser locale -> default to english)
      let savedLang = localStorage.getItem(STORAGE_KEY);
      if (!savedLang || !SUPPORTED_LANGS.includes(savedLang)) {
        const browserLang = (navigator.language || navigator.userLanguage || '').substring(0, 2);
        savedLang = SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
      }

      // 5. Initialize i18next library
      await window.i18next.init({
        lng: savedLang,
        fallbackLng: 'en',
        resources: resources,
        debug: false
      });

      // 6. Set initial direction & layout
      setLanguageLayout(savedLang);

      // 7. Update UI dropdown state
      updateLanguageDropdownUI(savedLang);

      // 8. Translate content
      translatePage();

      // 9. Bind click handlers to the language options
      document.querySelectorAll('.pma-lang-option').forEach(option => {
        option.addEventListener('click', async function (e) {
          e.preventDefault();
          const targetLang = this.getAttribute('data-lang');
          if (SUPPORTED_LANGS.includes(targetLang) && targetLang !== window.i18next.language) {
            // Change language in i18next
            await window.i18next.changeLanguage(targetLang);

            // Save preference
            localStorage.setItem(STORAGE_KEY, targetLang);

            // Update direction & stylesheet
            setLanguageLayout(targetLang);

            // Update dropdown active class & trigger label
            updateLanguageDropdownUI(targetLang);

            // Rerender translations
            translatePage();
          }
        });
      });

    } catch (err) {
      console.error('PMA Language Translator Init Error:', err);
    }
  }

  // Execute initialization when DOM content is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslator);
  } else {
    initTranslator();
  }

})();
