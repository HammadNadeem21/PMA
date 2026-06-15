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
          title_part1: "Professional Training &",
          title_part2: "Accreditation",
          text: "PMA provides internationally aligned mediation training and professional development programs designed for lawyers, corporate professionals, HR teams, educators, and aspiring mediators.<br>Our workshops and certification programs focus on practical dispute resolution skills, negotiation strategies, communication, and ADR frameworks.",
          features: {
            feat1: "IMI Accreditation",
            feat2: "Expert Trainers",
            feat3: "Practical Learning",
            feat4: "Global Standards"
          },
          card_text: "Our training programs meet international standards and empower professionals to become effective, ethical, and globally competent mediators.",
          btn_text: "Explore Training Programs"
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
        },
        "about-page": {
          hero: {
            img_alt: "About PMA",
            eyebrow: "About PMA",
            title_part1: "Building a Culture of",
            title_part2: "Dialogue, Resolution & Mutual Understanding",
            lead: "Pakistan Mediators Association (PMA) is committed to advancing mediation and alternative dispute resolution across Pakistan through professional training, institutional collaboration, and internationally recognized standards of practice."
          },
          about: {
            hero_img_alt: "About PMA",
            hero_eyebrow: "About PMA",
            hero_title_part1: "Building a Culture of",
            hero_title_part2: "Dialogue, Resolution & Mutual Understanding",
            hero_lead: "Pakistan Mediators Association (PMA) is committed to advancing mediation and alternative dispute resolution across Pakistan through professional training, institutional collaboration, and internationally recognized standards of practice.",
            badge_years: "YEARS",
            badge_stat_label: "Promoting Mediation<br>Excellence",
            nav_tab1: "About PMA",
            nav_tab2: "Our Vision",
            nav_tab3: "Our Mission",
            nav_tab4: "Our Impact",
            tab1_title1: "About",
            tab1_title2: "PMA",
            tab1_text: "PMA Established in 2013 and registered with the Government of Pakistan, PMA is the professional body authorized by the Centre for Effective Dispute Resolution (CEDR), United Kingdom, to deliver CEDR-model mediation training in Pakistan.<br><br>PMA has signed a Memorandum of Understanding with the Thailand Arbitration Centre (2018) and maintains strong relations with institutions in other SAARC countries.<br><br>Our association comprises internationally accredited CEDR-trained master trainers and mediators who have successfully conducted numerous training programs for judges and lawyers across Sindh, Punjab, and Islamabad, thereby raising professional standards of mediation in the country.",
            tab2_title1: "Our",
            tab2_title2: "Vision",
            tab2_text: "To establish mediation as the leading and most trusted method of dispute resolution in Pakistan, promoting a culture of constructive dialogue, mutual understanding, and peaceful coexistence.",
            tab3_title1: "Our",
            tab3_title2: "Mission",
            tab3_points: [
              "To promote mediation as an accessible and effective dispute resolution mechanism",
              "To train and accredit mediators in line with international standards",
              "To collaborate with courts, government institutions, and private sectors",
              "To raise awareness about the benefits of mediation across society"
            ],
            tab4_title1: "Our",
            tab4_title2: "Impact",
            tab4_text1: "PMA has successfully trained hundreds of lawyers, Judges, professionals and has played a key role in promoting court-connected mediation initiatives in Pakistan.",
            tab4_text2: "We continue to work closely with the judiciary and stakeholders to strengthen mediation as a sustainable dispute resolution system."
          },
          leadership: {
            title1: "Leadership",
            title2: "Messages",
            president: {
              name: "Aga Zafar Ahmad",
              role1: "Advocate Supreme Court of Pakistan",
              role2: "President",
              role3: "Pakistan Mediators Association",
              heading: "President's Message",
              quote: "Mediation is not just a professional tool, but a necessity for a developing legal system.",
              lead: "As the legal and commercial landscapes evolve, the role of ADR has never been more critical in ensuring swift, equitable, and effective justice. My focus as President is to expand our reach, ensuring that mediation becomes a cornerstone of our legal landscape.",
              read_more: "Read Full Message",
              sign_role: "Advocate Supreme Court of Pakistan<br>President, Pakistan Mediators Association",
              popup: {
                p1: "It is a profound honor to serve as the President of the Pakistan Mediators Association (PMA). As the legal and commercial landscapes evolve, the role of Alternative Dispute Resolution (ADR) has never been more critical in ensuring swift, equitable, and effective justice.",
                p2: "My journey as a founding member of this Association has been driven by a belief that mediation is not just a professional tool, but a necessity for a developing legal system. As we look toward the future, my commitment is to ensure our Association becomes a more vibrant and collaborative platform, bridging the gap between traditional litigation and modern dispute resolution.",
                p3: "Since our inception, the PMA has been dedicated to promoting and organizing the practice of mediation across Pakistan. We strive to maintain the highest standards of professional conduct and to provide a unified voice for mediators nationwide. My focus as President is to expand our reach, ensuring that Mediation becomes a cornerstone of our legal landscape, recognized by both the judiciary and the public as a vital tool for social and economic harmony.",
                commit_heading: "We are committed to:",
                commit_list: [
                  "<strong>Capacity Building & Professional Development:</strong> Continuing to facilitate high-caliber training and accreditation for mediators to ensure world-class standards of practice to keep our members' skills at the forefront of the industry.",
                  "<strong>Advocacy:</strong> Engaging with stakeholders and the judiciary to integrate mediation into the mainstream legal framework.",
                  "<strong>Innovation:</strong> Embracing modern techniques and global best practices to resolve trade, maritime, and commercial conflicts effectively.",
                  "<strong>National Conventions:</strong> We will endeavour to organize regular gatherings to share insights, celebrate successes, and strengthen our collective voice across the country.",
                  "<strong>Enhanced Coordination:</strong> We are dedicated to improving communication and engagement between all members to ensure every perspective is heard and valued.",
                  "<strong>Membership Growth:</strong> We will actively welcome new professionals to expand the reach and influence of mediation within Pakistan's legal and business communities.",
                  "<strong>Code of Conduct for Mediators:</strong> Furthermore, a key priority for this term is the establishment of a new committee dedicated to coordinating with the Pakistan Bar Council and Provincial Bar Councils. This initiative will focus on formalizing a robust Code of Conduct for Mediators, ensuring that our practice remains grounded in the highest ethical and professional standards."
                ],
                closing: "I invite you all to join us in this mission to mainstream mediation and foster a culture of harmony and professional excellence in Pakistan."
              }
            },
            founding_president: {
              name: "Anwar Kashif Mumtaz",
              role1: "Advocate Supreme Court of Pakistan",
              role2: "Accredited Mediator",
              heading: "Founding President's Message",
              quote: "Together, we can build a culture where understanding prevails over confrontation.",
              lead: "Our mission is to promote mediation as an effective tool towards ethical and accessible means of dispute resolution within our beloved country.",
              read_more: "Read Full Message",
              sign_role: "Advocate Supreme Court<br>Accredited Mediator",
              popup: {
                p1: "Today, being the founding president of Pakistan Mediators Association, I am delighted to witness the growth of platform dedicated for dialogue and peaceful dispute resolution. Our mission is to promote Mediation as an effective tool towards ethical and accessible means of dispute resolution within our beloved country. We remain committed to upholding the highest professional standards and fostering trust in alternative dispute resolution mechanisms.",
                p2: "Through collaboration, training and continuous learning, we aim to strengthen the capacity of Mediators nationwide.",
                p3: "I encourage all the stakeholders to embrace mediation as a constructive path to supplement the judiciary and towards justice and harmony.",
                closing: "Together, we can build a culture where understanding prevails over confrontation."
              }
            },
            stats: {
              s1_title: "Hundreds Trained",
              s1_text: "Lawyers, Judges & Professionals trained across Pakistan.",
              s2_title: "Court-Connected Mediation",
              s2_text: "Promoting and strengthening mediation initiatives nationwide.",
              s3_title: "Strong Collaboration",
              s3_text: "Working closely with the judiciary and stakeholders for a sustainable dispute resolution system."
            }
          }, partners: {
            title: "Our Partners",
            p1: "Sindh High Court",
            p2: "Govt. Institutions",
            p3: "International Mediation Institute"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "Mediation consultation room",
            eyebrow: "Mediation",
            title_part1: "Resolve Disputes Through",
            title_part2: "Dialogue & Understanding",
            lead: "Mediation is a voluntary, confidential, and structured process where a neutral mediator helps parties reach a mutually acceptable and sustainable resolution."
          },
          mediation: {
            title1: "What is",
            title2: "Mediation?",
            text1: "Mediation is a voluntary, confidential, and structured process in which a neutral and impartial third party — the mediator — facilitates dialogue between disputing parties to help them reach a mutually acceptable and sustainable resolution.",
            text2: "Unlike litigation, mediation emphasizes collaboration, self-determination, and creative problem-solving. It enables parties to achieve faster, more cost-effective outcomes while preserving relationships.",
            img_alt: "What is Mediation"
          }, whyChoose: {
            heading_part1: "Why Choose",
            heading_part2: "Mediation",
            heading_part3: "with PMA?",
            cards: {
              card1: {
                title: "Faster & Cost-Effective",
                desc: "Resolve disputes in weeks, not years."
              },
              card2: {
                title: "Confidential",
                desc: "Private process with no public records."
              },
              card3: {
                title: "Relationship-Preserving",
                desc: "Focus on mutual understanding and win-win solutions."
              },
              card4: {
                title: "Flexible & Collaborative",
                desc: "Parties control the outcome."
              },
              card5: {
                title: "IMI-Certified Standards",
                desc: "Internationally recognized mediator accreditation."
              }
            }
          }, banner: {
            text: "PMA is Pakistan's <strong>first and oldest</strong> dedicated organization for mediation accreditation, professional training, and advocacy — <strong>established in 2013–2014</strong> and based in Karachi."
          },
          how_it_works: {
            title_part1: "How Mediation",
            title_part2: "Works?",
            img_alt: "Mediation process",
            steps: {
              step1: {
                num: "1",
                title: "Submit Your Request",
                desc: "You contact PMA to share the details of your dispute."
              },
              step2: {
                num: "2",
                title: "Initial Case Assessment",
                desc: "We review the matter and determine its suitability for mediation."
              },
              step3: {
                num: "3",
                title: "Mediator Assignment",
                desc: "A neutral and qualified mediator is assigned to your case."
              },
              step4: {
                num: "4",
                title: "Facilitated Sessions",
                desc: "The mediator facilitates structured dialogue to explore solutions."
              },
              step5: {
                num: "5",
                title: "Resolution & Agreement",
                desc: "Parties reach a mutually acceptable outcome and formalize the agreement."
              }
            }
          },
          who_we_serve: {
            title_part1: "Who We",
            title_part2: "Serve",
            cards: {
              card1: {
                title: "Individuals & Families",
                desc: "Helping individuals and families resolve personal and civil disputes."
              },
              card2: {
                title: "Businesses & Corporations",
                desc: "Supporting businesses in resolving commercial and workplace disputes."
              },
              card3: {
                title: "Government Institutions",
                desc: "Assisting government departments in resolving public sector disputes."
              },
              card4: {
                title: "NGOs & Community Organizations",
                desc: "Facilitating conflict resolution for community and social organizations."
              },
              card5: {
                title: "Law Firms & Legal Professionals",
                desc: "Partnering with legal professionals for effective ADR solutions."
              }
            }
          },
          cta: {
            title_part1: "Let’s Resolve Conflict",
            title_part2: "Peacefully.",
            subtitle: "Mediation creates understanding. Understanding creates solutions. Contact PMA today to learn how mediation can help you.",
            btn_text: "Contact Us Today"
          }

        },
        "services-page": {
  hero: {
    img_alt: "Services Hero",
    eyebrow: "Our Services",
    title_part1: "Professional Mediation &",
    title_part2: "ADR Services",
    lead: "PMA provides a comprehensive range of mediation, training, and advisory services to help individuals, organizations, and institutions resolve disputes effectively and build a culture of dialogue."
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
          title_part1: "پیشہ ورانہ تربیت اور",
          title_part2: "توثیق (Accreditation)",
          text: "PMA بین الاقوامی سطح کے مطابق مصالحت کی تربیت اور پیشہ ورانہ ترقی کے پروگرام فراہم کرتا ہے جو وکلاء، کارپوریٹ پیشہ ور افراد، HR ٹیموں، اساتذہ، اور ابھرتے ہوئے ثالثین کے لیے تیار کیے گئے ہیں۔<br>ہمارے ورکشاپس اور سرٹیفیکیشن پروگرامز تنازعات کے عملی حل کی مہارتوں، گفت و شنید کی حکمت عملیوں، باہمی رابطے اور ADR کے فریم ورکس پر توجہ مرکوز کرتے ہیں۔",
          features: {
            feat1: "IMI توثیق (Accreditation)",
            feat2: "ماہر ٹرینرز",
            feat3: "عملی سیکھنے کا عمل",
            feat4: "عالمی معیار"
          },
          card_text: "ہمارے تربیتی پروگرام بین الاقوامی معیارات پر پورا اترتے ہیں اور پیشہ ور افراد کو مؤثر، اخلاقی، اور عالمی سطح پر قابل ثالث بننے کے لیے بااختیار بناتے ہیں۔",
          btn_text: "تربیتی پروگرامز دریافت کریں"
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
        },
        "about-page": {
          hero: {
            img_alt: "PMA کے بارے میں",
            eyebrow: "PMA بابت",
            title_part1: "ایک ایسی ثقافت کی تعمیر",
            title_part2: "مکالمہ، تصفیہ اور باہمی افہام و تفہیم کے ذریعے",
            lead: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) پیشہ ورانہ تربیت، ادارہ جاتی تعاون، اور بین الاقوامی سطح پر تسلیم شدہ معیارات کے ذریعے پورے پاکستان میں میڈیشن (مصالحت) اور متبادل تنازعات کے حل (ADR) کو فروغ دینے کے لیے پرعزم ہے۔"
          },
          about: {
            hero_img_alt: "PMA کے بارے میں",
            hero_eyebrow: "PMA بابت",
            hero_title_part1: "ایک ایسی ثقافت کی تعمیر",
            hero_title_part2: "مکالمہ، تصفیہ اور باہمی افہام و تفہیم کے ذریعے",
            hero_lead: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) پیشہ ورانہ تربیت، ادارہ جاتی تعاون، اور بین الاقوامی سطح پر تسلیم شدہ معیارات کے ذریعے پورے پاکستان میں میڈیشن (مصالحت) اور متبادل تنازعات کے حل (ADR) کو فروغ دینے کے لیے پرعزم ہے۔",
            badge_years: "سال",
            badge_stat_label: "مصالحتی مہارت کا <br>فروغ",
            nav_tab1: "PMA کے بارے میں",
            nav_tab2: "ہمارا وژن",
            nav_tab3: "ہمارا مشن",
            nav_tab4: "ہمارا اثر",
            tab1_title1: "PMA کے",
            tab1_title2: "بارے میں",
            tab1_text: "PMA 2013 میں قائم ہوئی اور حکومت پاکستان کے ساتھ رجسٹرڈ ہے، PMA وہ پیشہ ورانہ ادارہ ہے جسے سینٹر فار ایفیکٹیو ڈسپیوٹ ریزولوشن (CEDR)، برطانیہ نے پاکستان میں CEDR ماڈل کی مصالحتی تربیت فراہم کرنے کا اختیار دیا ہے۔<br><br>PMA نے تھائی لینڈ آربیٹریشن سینٹر (2018) کے ساتھ مفاہمت کی ایک یادداشت پر دستخط کیے ہیں اور دیگر سارک ممالک کے اداروں کے ساتھ مضبوط تعلقات برقرار رکھے ہوئے ہے۔<br><br>ہماری ایسوسی ایشن بین الاقوامی سطح پر تسلیم شدہ CEDR سے تربیت یافتہ ماسٹر ٹرینرز اور مصالحت کاروں پر مشتمل ہے جنہوں نے سندھ، پنجاب اور اسلام آباد میں ججوں اور وکلاء کے لیے متعدد تربیتی پروگرام کامیابی کے ساتھ منعقد کیے ہیں، جس سے ملک میں مصالحت کے پیشہ ورانہ معیار بلند ہوئے ہیں۔",
            tab2_title1: "ہمارا",
            tab2_title2: "وژن",
            tab2_text: "پاکستان میں تنازعات کے حل کے سب سے نمایاں اور قابل اعتماد طریقے کے طور پر مصالحت (Mediation) کو قائم کرنا، تعمیری مکالمے، باہمی افہام و تفہیم اور پرامن بقائے باہمی کی ثقافت کو فروغ دینا۔",
            tab3_title1: "ہمارا",
            tab3_title2: "مشن",
            tab3_points: [
              "مصالحت کو تنازعات کے حل کے ایک آسان اور مؤثر طریقہ کار کے طور پر فروغ دینا",
              "بین الاقوامی معیارات کے مطابق مصالحت کاروں (Mediators) کو تربیت دینا اور ان کی تصدیق کرنا",
              "عدالتوں، حکومتی اداروں اور نجی شعبوں کے ساتھ تعاون کرنا",
              "پورے معاشرے میں مصالحت کے فوائد کے بارے میں آگاہی پیدا کرنا"
            ],
            tab4_title1: "ہمارا",
            tab4_title2: "اثر",
            tab4_text1: "PMA نے سینکڑوں وکلاء، ججوں اور پیشہ ور افراد کو کامیابی کے ساتھ تربیت دی ہے اور پاکستان میں عدالتوں سے منسلک مصالحتی اقدامات کو فروغ دینے میں کلیدی کردار ادا کیا ہے۔",
            tab4_text2: "ہم مصالحت کو ایک پائیدار تنازعات کے حل کے نظام کے طور پر مضبوط بنانے کے لیے عدلیہ اور اسٹیک ہولڈرز کے ساتھ مل کر کام جاری رکھے ہوئے ہیں۔"
          },
          leadership: {
            title1: "قیادت کے",
            title2: "پیغامات",
            president: {
              name: "آغا ظفر احمد",
              role1: "ایڈووکیٹ سپریم کورٹ آف پاکستان",
              role2: "صدر",
              role3: "پاکستان میڈیٹرز ایسوسی ایشن",
              heading: "صدر کا پیغام",
              quote: "مصالحت (میڈیشن) صرف ایک پیشہ ورانہ ذریعہ نہیں، بلکہ ترقی پذیر قانونی نظام کے لیے ایک ناگزیر ضرورت ہے۔",
              lead: "جیسے جیسے قانونی اور تجارتی منظر نامہ تبدیل ہو رہا ہے، فوری، منصفانہ اور مؤثر انصاف کی فراہمی کے لیے اے ڈی آر (ADR) کا کردار پہلے سے کہیں زیادہ اہم ہو گیا ہے۔ بطور صدر میری توجہ اپنے دائرہ کار کو وسعت دینے پر ہے، تاکہ مصالحت ہمارے قانونی منظر نامے کا ایک بنیادی ستون بن سکے۔",
              read_more: "مکمل پیغام پڑھیں",
              sign_role: "ایڈووکیٹ سپریم کورٹ آف پاکستان<br>صدر، پاکستان میڈیٹرز ایسوسی ایشن",
              popup: {
                p1: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے صدر کی حیثیت سے خدمات انجام دینا میرے لیے انتہائی اعزاز کی بات ہے۔ جیسے جیسے قانونی اور تجارتی منظر نامہ تبدیل ہو رہا ہے، فوری، منصفانہ اور مؤثر انصاف کو یقینی بنانے میں متبادل تنازعات کے حل (ADR) کا کردار کبھی اتنا اہم نہیں رہا۔",
                p2: "اس ایسوسی ایشن کے بانی رکن کے طور پر میرا سفر اس یقین کے ساتھ شروع ہوا کہ مصالحت صرف ایک پیشہ ورانہ ذریعہ نہیں بلکہ ترقی پذیر قانونی نظام کے لیے ایک ناگزیر ضرورت ہے۔ جیسے ہی ہم مستقبل کی طرف دیکھتے ہیں، میرا عزم ہے کہ ہم اپنی ایسوسی ایشن کو ایک زیادہ متحرک اور باہمی تعاون کا پلیٹ فارم بنائیں، جو روایتی قانونی چارہ جوئی اور جدید تنازعات کے حل کے درمیان خلیج کو پاٹ سکے۔",
                p3: "اپنے قیام کے بعد سے، پی ایم اے پاکستان بھر میں مصالحت کے عمل کو فروغ دینے اور اسے منظم کرنے کے لیے وقف ہے۔ ہم پیشہ ورانہ رویے کے اعلیٰ ترین معیار کو برقرار رکھنے اور ملک بھر میں مصالحت کاروں کے لیے ایک متحدہ آواز فراہم کرنے کی کوشش کرتے ہیں۔ بطور صدر میری توجہ اپنے دائرہ کار کو وسعت دینے پر ہے، تاکہ یہ بات یقینی بنائی جا سکے کہ مصالحت ہمارے قانونی منظر نامے کا ایک بنیادی ستون بن جائے، جسے عدلیہ اور عوام دونوں سماجی اور اقتصادی ہم آہنگی کے لیے ایک اہم ذریعے کے طور پر تسلیم کریں۔",
                commit_heading: "ہم مندرجہ ذیل کے لیے پرعزم ہیں:",
                commit_list: [
                  "<strong>صلاحیتوں کی تعمیر اور پیشہ ورانہ ترقی:</strong> مصالحت کاروں کے لیے اعلیٰ معیار کی تربیت اور منظوری کی سہولت فراہم کرنا جاری رکھنا تاکہ عالمی معیار کے طریقوں کو یقینی بنایا جا سکے اور ہمارے اراکین کی مہارتیں صنعت میں سب سے آگے رہیں۔",
                  "<strong>وکالت و تائید:</strong> مصالحت کو مرکزی دھارے کے قانونی فریم ورک میں ضم کرنے کے لیے شراکت داروں اور عدلیہ کے ساتھ مل کر کام کرنا۔",
                  "<strong>جدت طرازی:</strong> تجارتی، بحری اور کاروباری تنازعات کو مؤثر طریقے سے حل کرنے کے لیے جدید تکنیکوں اور عالمی بہترین طریقوں کو اپنانا۔",
                  "<strong>قومی کنونشنز:</strong> ہم ملک بھر میں تجربات شیئر کرنے، کامیابیوں کا جشن منانے اور اپنی اجتماعی آواز کو مضبوط بنانے کے لیے باقاعدہ اجتماعات منعقد کرنے کی کوشش کریں گے۔",
                  "<strong>بہتر ہم آہنگی:</strong> ہم تمام اراکین کے درمیان رابطے اور شمولیت کو بہتر بنانے کے لیے وقف ہیں تاکہ ہر نقطہ نظر کو سنا اور اہمیت دی جا سکے۔",
                  "<strong>اراکین کی تعداد میں اضافہ:</strong> ہم پاکستان کی قانونی اور کاروباری برادریوں میں مصالحت کے اثر و رسوخ اور رسائی کو بڑھانے کے لیے نئے پیشہ ور افراد کا گرمجوشی سے خیرمقدم کریں گے۔",
                  "<strong>مصالحت کاروں کے لیے ضابطہ اخلاق:</strong> مزید برآں، اس مدت کے لیے ایک اہم ترجیح پاکستان بار کونسل اور صوبائی بار کونسلوں کے ساتھ ہم آہنگی کے لیے ایک نئی کمیٹی کا قیام ہے۔ یہ اقدام مصالحت کاروں کے لیے ایک جامع ضابطہ اخلاق کو باقاعدہ بنانے پر توجہ مرکوز کرے گا، اس بات کو یقینی بناتے ہوئے کہ ہماری پریکٹس اعلیٰ ترین اخلاقی اور پیشہ ورانہ معیارات پر مبنی رہے۔"
                ],
                closing: "میں آپ سب کو دعوت دیتا ہوں کہ مصالحت کو مرکزی دھارے میں لانے اور پاکستان میں ہم آہنگی اور پیشہ ورانہ مہارت کے کلچر کو فروغ دینے کے اس مشن میں ہمارا ساتھ دیں۔"
              }
            },
            founding_president: {
              name: "انوار کاشف ممتاز",
              role1: "ایڈووکیٹ سپریم کورٹ آف پاکستان",
              role2: "منظور شدہ مصالحت کار",
              heading: "بانی صدر کا پیغام",
              quote: "مل کر، ہم ایک ایسی ثقافت کی تعمیر کر سکتے ہیں جہاں محاذ آرائی پر افہام و تفہیم غالب ہو۔",
              lead: "ہمارا مشن اپنے پیارے ملک کے اندر اخلاقی اور آسان ترین طریقے سے تنازعات کے حل کے لیے مصالحت کو ایک مؤثر ذریعے کے طور پر فروغ دینا ہے۔",
              read_more: "مکمل پیغام پڑھیں",
              sign_role: "ایڈووکیٹ سپریم کورٹ<br>منظور شدہ مصالحت کار",
              popup: {
                p1: "آج، پاکستان میڈیٹرز ایسوسی ایشن کا بانی صدر ہونے کے ناطے، مجھے مکالمے اور پرامن تائید و تصفیہ کے لیے وقف اس پلیٹ فارم کی ترقی دیکھ کر دلی خوشی ہو رہی ہے۔ ہمارا مشن اپنے پیارے ملک کے اندر اخلاقی اور آسان ترین طریقے سے تنازعات کے حل کے لیے مصالحت کو ایک مؤثر ذریعے کے طور پر فروغ دینا ہے۔ ہم اعلیٰ ترین پیشہ ورانہ معیارات کو برقرار رکھنے اور متبادل تنازعات کے حل کے طریقہ کار پر اعتماد کو فروغ دینے کے لیے پرعزم ہیں۔",
                p2: "باهي تعاون، تربيت اور مسلسل سيکهڻ جي ذريعي، هم ملک بهر ۾ مصالحت ڪارن جي صلاحيتن کي مضبوط بنائڻ چاهيون ٿا.",
                p3: "مين تمام شريڪ دارن جي حوصلي افزائي ڪريان ٿو ته اهي انصاف ۽ هم آهنگي جي حصول لاءِ ۽ عدليه جي مدد لاءِ مصالحت کي هڪ تعميري رستي جي طور تي اپنائين.",
                closing: "مل کر، ہم ایک ایسی ثقافت کی تعمیر کر سکتے ہیں جہاں محاذ آرائی پر افہام و تفہیم غالب ہو۔"
              }
            },
            stats: {
              s1_title: "سینکڑوں تربیت یافتہ",
              s1_text: "پورے پاکستان میں وکلاء، ججز اور پیشہ ور افراد کو تربیت دی گئی۔",
              s2_title: "عدالت سے منسلک مصالحت",
              s2_text: "ملک بھر میں مصالحتی اقدامات کا فروغ اور استحکام۔",
              s3_title: "مضبوط تعاون",
              s3_text: "پائیدار تنازعات کے حل کے نظام کے لیے عدلیہ اور شراکت داروں کے ساتھ مل کر کام کرنا۔"
            }
          },
          partners: {
            title: "ہمارے پارٹنرز",
            p1: "سندھ ہائی کورٹ",
            p2: "سرکاری ادارے",
            p3: "انٹرنیشنل میڈیشن انسٹی ٹیوٹ"
          },
        }, "mediation-page": {
          hero: {
            img_alt: "مصالحتی مشاورتی کمرہ",
            eyebrow: "مصالحت (Mediation)",
            title_part1: "تنازعات کا حل تلاش کریں",
            title_part2: "مکالمے اور باہمی افہام و تفہیم کے ذریعے",
            lead: "مصالحت ایک رضاکارانہ، بااعتماد اور منظم عمل ہے جہاں ایک غیر جانبدار ثالث فریقین کو باہمی طور پر قابل قبول اور پائیدار حل تک پہنچنے میں مدد کرتا ہے۔"
          },
          mediation: {
            title1: "مصالحت (Mediation)",
            title2: "کیا ہے؟",
            text1: "مصالحت ایک رضاکارانہ، بااعتماد اور منظم عمل ہے جس میں ایک غیر جانبدار اور بے لوث تیسرا فریق — یعنی ثالث (Mediator) — متنازعہ فریقین کے درمیان بات چیت کو آسان بناتا ہے تاکہ وہ باہمی طور پر قابل قبول اور پائیدار حل تک پہنچ سکیں۔",
            text2: "عدالتی چارہ جوئی (Litigation) کے برعکس، مصالحت باہمی تعاون، خود ارادیت، اور تعمیری طریقے سے مسائل کو حل کرنے پر زور دیتی ہے۔ یہ فریقین کو تعلقات برقرار رکھنے کے ساتھ ساتھ تیز تر اور انتہائی کم لاگت میں نتائج حاصل کرنے کے قابل بناتی ہے۔",
            img_alt: "مصالحت کیا ہے"
          }, whyChoose: {
            heading_part1: "PMA کے ساتھ",
            heading_part2: "مصالحت",
            heading_part3: "کا انتخاب کیوں کریں؟",
            cards: {
              card1: {
                title: "تیز تر اور انتہائی کم لاگت",
                desc: "برسوں کے بجائے چند ہفتوں میں تنازعات کا حل پائیں۔"
              },
              card2: {
                title: "مکمل رازداری",
                desc: "بغیر کسی عوامی ریکارڈ کے ایک نجی اور محفوظ عمل۔"
              },
              card3: {
                title: "تعلقات کو برقرار رکھنا",
                desc: "باہمی افہام و تفہیم اور دونوں فریقین کی کامیابی (win-win) پر توجہ۔"
              },
              card4: {
                title: "لچکدار اور باہمی تعاون",
                desc: "نتائج اور فیصلوں پر فریقین کا اپنا مکمل اختیار۔"
              },
              card5: {
                title: "IMI سے تصدیق شدہ معیار",
                desc: "ثالثین (Mediators) کے لیے بین الاقوامی سطح پر تسلیم شدہ اسناد۔"
              }
            }
          },
          banner: {
            text: "PMA ثالثی کی توثیق، پیشہ ورانہ تربیت، اور وکالت کے لیے پاکستان کی <strong>پہلی اور قدیم ترین</strong> سرشار تنظیم ہے — جو <strong>2013–2014 میں قائم ہوئی</strong> اور اس کا صدر دفتر کراچی میں ہے۔"
          },
          how_it_works: {
            title_part1: "ثالثی (Mediation)",
            title_part2: "کیسے کام کرتی ہے؟",
            img_alt: "ثالثی کا عمل",
            steps: {
              step1: {
                num: "۱",
                title: "اپنی درخواست جمع کروائیں",
                desc: "آپ اپنے تنازعہ کی تفصیلات شیئر کرنے کے لیے PMA سے رابطہ کرتے ہیں۔"
              },
              step2: {
                num: "۲",
                title: "کیس کا ابتدائی جائزہ",
                desc: "ہم معاملے کا جائزہ لیتے ہیں اور ثالثی کے لیے اس کی موزونیت کا تعین کرتے ہیں۔"
              },
              step3: {
                num: "۳",
                title: "ثالث (Mediator) کا تعین",
                desc: "آپ کے کیس کے لیے ایک غیر جانبدار اور اہل ثالث کا تعین کیا جاتا ہے۔"
              },
              step4: {
                num: "۴",
                title: "ثالثی کے باقاعدہ سیشنز",
                desc: "ثالث حل تلاش کرنے کے لیے فریقین کے درمیان منظم اور تعمیری گفتگو کی سہولت فراہم کرتا ہے۔"
              },
              step5: {
                num: "۵",
                title: "تصفیہ اور معاہدہ",
                desc: "فریقین باہمی طور پر قابل قبول نتیجے پر پہنچتے ہیں اور معاہدے کو رسمی شکل دیتے ہیں۔"
              }
            }
          },
           who_we_serve: {
    heading_part1: "ہم کن کو",
    heading_part2: "خدمات فراہم کرتے ہیں",
    cards: {
      card1: {
        title: "افراد اور خاندان",
        desc: "افراد اور خاندانوں کو ان کے ذاتی اور دیوانی (civil) تنازعات حل کرنے میں مدد فراہم کرنا۔"
      },
      card2: {
        title: "کاروبار اور کارپوریشنز",
        desc: "تجارتی اور کام کی جگہ کے تنازعات کو حل کرنے میں کاروباری اداروں کی معاونت کرنا۔"
      },
      card3: {
        title: "سرکاری ادارے",
        desc: "پبلک سیکٹر کے تنازعات کو حل کرنے میں سرکاری محکموں کی مدد کرنا۔"
      },
      card4: {
        title: "این جی اوز اور کمیونٹی تنظیمیں",
        desc: "کمیونٹی اور سماجی تنظیموں کے لیے تنازعات کے حل کو آسان بنانا۔"
      },
      card5: {
        title: "لا فرمز اور قانونی ماہرین",
        desc: "مؤثر ADR (متبادل تصفیہ تنازعات) کے حل کے لیے قانونی ماہرین کے ساتھ شراکت داری۔"
      }
    }
  },
  cta: {
    title_part1: "آئیں تنازعات کو حل کریں",
    title_part2: "امن و امان کے ساتھ۔",
    subtitle: "مصالحت افہام و تفہیم پیدا کرتی ہے۔ افہام و تفہیم سے حل نکلتے ہیں۔ یہ جاننے کے لیے کہ مصالحت آپ کی کیسے مدد کر سکتی ہے، آج ہی PMA سے رابطہ کریں۔",
    btn_text: "آج ہی ہم سے رابطہ کریں"
  }
        },
        "services-page": {
  hero: {
    img_alt: "خدمات کا ہیرو امیج",
    eyebrow: "ہماری خدمات",
    title_part1: "پیشہ ورانہ مصالحت اور",
    title_part2: "ADR خدمات",
    lead: "PMA مصالحت، تربیت، اور مشاورتی خدمات کا ایک جامع دائرہ فراہم کرتا ہے تاکہ افراد، تنظیموں اور اداروں کو تنازعات کو مؤثر طریقے سے حل کرنے اور باہمی گفتگو کے کلچر کو فروغ دینے میں مدد مل سکے۔"
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
    title_part1: "التدريب المهني و",
    title_part2: "الاعتماد (Accreditation)",
    text: "توفر PMA برامج تدريب وتطوير مهني متوافقة مع المعايير الدولية في مجال الوساطة، ومصممة خصيصاً للمحامين، ومحترفي الشركات، وفرق الموارد البشرية، والمعلمين، والوسطاء الطموحين.<br>تركز ورش العمل وبرامج الشهادات لدينا على مهارات حل النزاعات العملية، واستراتيجيات التفاوض، والتواصل، وأطر الحلول البديلة لتسوية النزاعات (ADR).",
    features: {
      feat1: "اعتماد IMI",
      feat2: "مدربون خبراء",
      feat3: "تعلم عملي",
      feat4: "معايير عالمية"
    },
    card_text: "تلبي برامجنا التدريبية المعايير الدولية وتمكن المحترفين من أن يصبحوا وسطاء فعالين وأخلاقيين ومؤهلين عالمياً.",
    btn_text: "استكشاف برامج التدريب"
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
        },
        "about-page": {
          hero: {
            img_alt: "عن الجمعية الباكستانية للوسطاء",
            eyebrow: "عن PMA",
            title_part1: "بناء ثقافة قائمة على",
            title_part2: "الحوار، والحلول السلمية، والتفاهم المتبادل",
            lead: "تلتزم الجمعية الباكستانية للوسطاء (PMA) بتطوير الوساطة والحلول البديلة لتسوية النزاعات (ADR) في جميع أنحاء باكستان من خلال التدريب المهني، والتعاون المؤسسي، ومعايير الممارسة المعترف بها دولياً."
          },
          about: {
            hero_img_alt: "عن الجمعية الباكستانية للوسطاء",
            hero_eyebrow: "عن PMA",
            hero_title_part1: "بناء ثقافة قائمة على",
            hero_title_part2: "الحوار، والحلول السلمية، والتفاهم المتبادل",
            hero_lead: "تلتزم الجمعية الباكستانية للوسطاء (PMA) بتطوير الوساطة والحلول البديلة لتسوية النزاعات (ADR) في جميع أنحاء باكستان من خلال التدريب المهني، والتعاون المؤسسي، ومعايير الممارسة المعترف بها دولياً.",
            badge_years: "سنوات",
            badge_stat_label: "تعزيز التميز في <br>مجال الوساطة",
            nav_tab1: "عن الجمعية",
            nav_tab2: "رؤيتنا",
            nav_tab3: "رسالتنا",
            nav_tab4: "تأثيرنا",
            tab1_title1: "عن",
            tab1_title2: "PMA",
            tab1_text: "تأسست جمعية PMA في عام 2013 وهي مسجلة لدى حكومة باكستان، وهي الهيئة المهنية المعتمدة من قبل مركز التسوية الفعالة للنزاعات (CEDR) في المملكة المتحدة، لتقديم التدريب على الوساطة وفقًا لنموذج CEDR في باكستان.<br><br>وقعت PMA مذكرة تفاهم مع مركز تايلاند للتحكيم (2018) وتحافظ على علاقات قوية مع المؤسسات في دول سارك (SAARC) الأخرى.<br><br>تضم جمعيتنا مدربين معتمدين دولياً ووسطاء مدربين في CEDR نجحوا في تقديم العديد من البرامج التدريبية للقضاة والمحامين في جميع أنحاء السند والبنجاب وإسلام آباد، مما ساهم في رفع المعايير المهنية للوساطة في البلاد.",
            tab2_title1: "رؤيتنا",
            tab2_title2: "",
            tab2_text: "ترسيخ الوساطة كوسيلة رائدة والأكثر موثوقية لتسوية النزاعات في باكستان، وتعزيز ثقافة الحوار البنّاء، والتفاهم المتبادل، والتعايش السلمي.",
            tab3_title1: "رسالتنا",
            tab3_title2: "",
            tab3_points: [
              "تعزيز الوساطة كآلية ميسرة وفعالة لتسوية النزاعات",
              "تدريب واعتماد الوسطاء بما يتماشى مع المعايير الدولية",
              "التعاون مع المحاكم والمؤسسات الحكومية والقطاعات الخاصة",
              "رفع مستوى الوعي بفوائد الوساطة في جميع أنحاء المجتمع"
            ],
            tab4_title1: "تأثيرنا",
            tab4_title2: "",
            tab4_text1: "نجحت جمعية PMA في تدريب مئات المحامين والقضاة والمهنيين، ولعبت دوراً رئيسياً في تعزيز مبادرات الوساطة المرتبطة بالمحاكم في باكستان.",
            tab4_text2: "نحن نواصل العمل عن كثب مع القضاء وأصحاب المصلحة لتعزيز الوساطة كنظام مستدام لتسوية النزاعات."
          },
          leadership: {
            title1: "القيادة",
            title2: "الرسائل",
            president: {
              name: "آغا ظفر أحمد",
              role1: "محامٍ لدى المحكمة العليا في باكستان",
              role2: "الرئيس",
              role3: "الجمعية الباكستانية للوسطاء",
              heading: "رسالة الرئيس",
              quote: "الوساطة ليست مجرد أداة مهنية، بل هي ضرورة ملحة لنظام قانوني متطور.",
              lead: "مع تطور المشهد القانوني والتجاري، لم يكن دور الحلول البديلة لتسوية النزاعات (ADR) أكثر أهمية من أي وقت مضى لضمان تحقيق عدالة سريعة ومنصفة وفعالة. ينصب تركيزي كرئيس على توسيع نطاق انتشارنا، لضمان أن تصبح الوساطة حجر الزاوية في مشهدنا القانوني.",
              read_more: "قراءة الرسالة كاملة",
              sign_role: "محامٍ لدى المحكمة العليا في باكستان<br>رئيس الجمعية الباكستانية للوسطاء",
              popup: {
                p1: "إنه لشرف كبير لي أن أخدم كرئيس للجمعية الباكستانية للوسطاء (PMA). مع تطور المشهد القانوني والتجاري، لم يكن دور الحلول البديلة لتسوية النزاعات (ADR) أكثر أهمية من أي وقت مضى لضمان تحقيق عدالة سريعة ومنصفة وفعالة.",
                p2: "إن مسيرتي كعضو مؤسس في هذه الجمعية كانت مدفوعة بإيماني بأن الوساطة ليست مجرد أداة مهنية، بل هي ضرورة لنظام قانوني متطور. وبينما نتطلع نحو المستقبل، فإن التزامي هو ضمان أن تصبح جمعيتنا منصة أكثر حيوية وتعاوناً، لسد الفجوة بين التقاضي التقليدي والحلول الحديثة لتسوية النزاعات.",
                p3: "منذ تأسيسنا، كرست PMA جهودها لتعزيز وتنظيم ممارسة الوساطة في جميع أنحاء باكستان. نحن نسعى جاهدين للحفاظ على أعلى معايير السلوك المهني وتقديم صوت موحد للوسطاء على مستوى الوطن. ينصب تركيزي كرئيس على توسيع نطاق انتشارنا، لضمان أن تصبح الوساطة حجر الزاوية في مشهدنا القانوني، ومعترفاً بها من قبل كل من القضاء والجمهور كأداة حيوية للوئام الاجتماعي والاقتصادي.",
                commit_heading: "نحن ملتزمون بـ:",
                commit_list: [
                  "<strong>بناء القدرات والتطوير المهني:</strong> الاستمرار في تسهيل التدريب والاعتماد رفيع المستوى للوسطاء لضمان ممارسات ذات معايير عالمية للحفاظ على مهارات أعضائنا في طليعة هذه المهنة.",
                  "<strong>الدعم والمناصرة:</strong> التواصل مع أصحاب المصلحة والقضاء لدمج الوساطة في الإطار القانوني السائد.",
                  "<strong>الابتكار:</strong> تبني التقنيات الحديثة وأفضل الممارسات العالمية لحل النزاعات التجارية والبحرية والشركات بفعالية.",
                  "<strong>المؤتمرات الوطنية:</strong> سنسعى لتنظيم لقاءات منتظمة لتبادل الأفكار والاحتفاء بالنجاحات وتعزيز صوتنا الجماعي في جميع أنحاء البلاد.",
                  "<strong>التنسيق المحسن:</strong> نحن ملتزمون بتحسين التواصل والمشاركة بين جميع الأعضاء لضمان سماع وتقدير كل وجهة نظر.",
                  "<strong>نمو العضوية:</strong> نرحب بنشاط بالمهنيين الجدد لتوسيع نطاق الوساطة وتأثيرها داخل المجتمعات القانونية والتجارية في باكستان.",
                  "<strong>ميثاق الشرف للوسطاء:</strong> علاوة على ذلك، فإن الأولوية الرئيسية لهذه الدورة هي إنشاء لجنة جديدة مخصصة للتنسيق مع مجلس بار الباكستاني ومجالس بار الأقاليم. سيركز هذا القرار على إضفاء الطابع الرسمي على ميثاق شرف قوي وصارم للوسطاء، مما يضمن بقاء ممارستنا قائمة على أعلى المعايير الأخلاقية والمهنية."
                ],
                closing: "إنني أدعوكم جميعاً للانضمام إلينا في هذه المهمة لتعميم الوساطة وتعزيز ثقافة الانسجام والتميز المهني في باكستان."
              }
            },
            founding_president: {
              name: "أنور كاشف ممتاز",
              role1: "محامٍ لدى المحكمة العليا في باكستان",
              role2: "وسيط معتمد",
              heading: "رسالة الرئيس المؤسس",
              quote: "معاً، يمكننا بناء ثقافة يسود فيها التفاهم على المواجهة.",
              lead: "إن رسالتنا هي تعزيز الوساطة كأداة فعالة نحو وسائل أخلاقية ومتاحة لتسوية النزاعات داخل وطننا الحبيب.",
              read_more: "قراءة الرسالة كاملة",
              sign_role: "محامٍ لدى المحكمة العليا<br>وسيط معتمد",
              popup: {
                p1: "اليوم، وبصفتي الرئيساً المؤسساً للجمعية الباكستانية للوسطاء، يسعدني جداً أن أشهد نمو هذه المنصة المخصصة للحوار والحل السلمي للنزاعات. إن رسالتنا هي تعزيز الوساطة كأداة فعالة نحو وسائل أخلاقية ومتاحة لتسوية النزاعات داخل وطننا الحبيب. ونحن لا نزال ملتزمين بإنفاذ أعلى المعايير المهنية وتعزيز الثقة في آليات الحلول البديلة لتسوية النزاعات.",
                p2: "من خلال التعاون والتدريب والتعلم المستمر، نهدف إلى تعزيز قدرات الوسطاء في جميع أنحاء البلاد.",
                p3: "أحث جميع أصحاب المصلحة على تبني الوساطة كمسار بناء لدعم القضاء والمضي قدماً نحو العدالة والوئام.",
                closing: "معاً، يمكننا بناء ثقافة يسود فيها التفاهم على المواجهة."
              }
            },
            stats: {
              s1_title: "تدريب المئات",
              s1_text: "تدريب المحامين والقضاة والمهنيين في جميع أنحاء باكستان.",
              s2_title: "الوساطة المرتبطة بالمحاكم",
              s2_text: "تعزيز وتقوية مبادرات الوساطة على مستوى البلاد.",
              s3_title: "تعاون قوي",
              s3_text: "العمل عن كثب مع القضاء وأصحاب المصلحة من أجل نظام مستدام لتسوية النزاعات."
            }
          },
          partners: {
            title: "شركاؤنا",
            p1: "محكمة السند العليا",
            p2: "المؤسسات الحكومية",
            p3: "المعهد الدولي للوساطة"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "غرفة الاستشارات الخاصة بالوساطة",
            eyebrow: "الوساطة (Mediation)",
            title_part1: "حل النزاعات من خلال",
            title_part2: "الحوار وبناء التفاهم",
            lead: "الوساطة هي عملية تطوعية، سرية، ومنظمة يساعد من خلالها وسيط محايد الأطراف على التوصل إلى حل مستدام ومقبول للجميع."
          },
          mediation: {
            title1: "ما هي",
            title2: "الوساطة؟",
            text1: "الوساطة هي عملية تطوعية وسرية ومنظمة يقوم فيها طرف ثالث محايد ونزيه — وهو الوسيط (Mediator) — بتسهيل الحوار بين الأطراف المتنازعة لمساعدتهم على التوصل إلى حل مقبول ومستدام للجميع.",
            text2: "على عكس التقاضي في المحاكم، تركز الوساطة على التعاون، والتقرير الذاتي، والحل المبتكر للمشكلات. وهي تمكّن الأطراف من تحقيق نتائج أسرع وأكثر فعالية من حيث التكلفة مع الحفاظ على العلاقات الودية.",
            img_alt: "ما هي الوساطة"
          }, whyChoose: {
            heading_part1: "لماذا تختار",
            heading_part2: "الوساطة",
            heading_part3: "مع PMA؟",
            cards: {
              card1: {
                title: "أسرع وأقل تكلفة",
                desc: "حل النزاعات في غضون أسابيع وليس سنوات."
              },
              card2: {
                title: "سرية تامة",
                desc: "عملية خاصة وآمنة دون أي سجلات عامة."
              },
              card3: {
                title: "الحفاظ على العلاقات",
                desc: "التركيز على التفاهم المتبادل والحلول المرضية للطرفين (win-win)."
              },
              card4: {
                title: "مرنة وتشاركيه",
                desc: "الأطراف المتنازعة تتحكم بشكل كامل في النتائج والقرارات."
              },
              card5: {
                title: "معايير معتمدة من IMI",
                desc: "اعتماد للوسطاء معترف به على المستوى الدولي."
              }
            }
          },
          banner: {
            text: "إن PMA هي المنظمة المتخصصة <strong>الأولى والأقدم</strong> في باكستان لاعتماد الوساطة، والتدريب المهني، والمناصرة — <strong>تأسست في 2013–2014</strong> ومقرها الرئيسي في كراتشي."
          },
          how_it_works: {
            title_part1: "كيف تعمل",
            title_part2: "الوساطة؟",
            img_alt: "عملية الوساطة",
            steps: {
              step1: {
                num: "١",
                title: "تقديم طلبك",
                desc: "تقوم بالاتصال بـ PMA لمشاركة تفاصيل النزاع الخاص بك."
              },
              step2: {
                num: "٢",
                title: "التقييم الأولي للحالة",
                desc: "نقوم بمراجعة المسألة وتحديد مدى ملاءمتها للوساطة."
              },
              step3: {
                num: "٣",
                title: "تعيين الوسيط",
                desc: "يتم تعيين وسيط محايد ومؤهل لمتابعة قضيتك."
              },
              step4: {
                num: "٤",
                title: "الجلسات الميسرة",
                desc: "يقوم الوسيط بتسهيل حوار منظم لاستكشاف الحلول الممكنة."
              },
              step5: {
                num: "٥",
                title: "التسوية والاتفاق",
                desc: "يتوصل الأطراف إلى نتيجة مقبولة للجميع ويتم صياغة الاتفاقية بشكل رسمي."
              }
            }
          },
          who_we_serve: {
            heading_part1: "من هم",
            heading_part2: "عملاؤنا؟",
            cards: {
              card1: {
                title: "الأفراد والعائلات",
                desc: "مساعدة الأفراد والعائلات على تسوية النزاعات الشخصية والمدنية."
              },
              card2: {
                title: "الشركات والمؤسسات",
                desc: "دعم الشركات في حل النزاعات التجارية والنزاعات في بيئة العمل."
              },
              card3: {
                title: "المؤسسات الحكومية",
                desc: "مساعدة الدوائر الحكومية في حل النزاعات المتعلقة بالقطاع العام."
              },
              card4: {
                title: "المنظمات غير الحكومية والمجتمعية",
                desc: "تسهيل حل النزاعات للمنظمات الاجتماعية والمجتمعية."
              },
              card5: {
                title: "شركات المحاماة والمحترفون القانونيون",
                desc: "الشراكة مع المتخصصين في القانون لتقديم حلول بديلة فعالة لتسوية النزاعات (ADR)."
              }
            }
          },
  cta: {
    title_part1: "دعونا نحل النزاعات",
    title_part2: "بطرق سلمية.",
    subtitle: "الوساطة تبني التفاهم، والتفاهم يصنع الحلول. اتصل بـ PMA اليوم لمعرفة كيف يمكن للوساطة أن تساعدك.",
    btn_text: "اتصل بنا اليوم"
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
    title_part1: "专业培训与",
    title_part2: "资质认证",
    text: "PMA 提供与国际接轨的调解 training 与专业发展项目，专为律师、企业高管、HR 团队、教育工作者以及有志于成为调解员的人士设计。<br>我们的工作坊和认证课程专注于实际的纠纷解决技巧、谈判策略、沟通技巧以及多样化纠纷解决机制（ADR）框架。",
    features: {
      feat1: "IMI 国际认证",
      feat2: "专家级培训师",
      feat3: "实战化学习",
      feat4: "全球化标准"
    },
    card_text: "我们的培训项目符合国际标准，赋予专业人士成为高效、恪守职业道德且具备全球竞争力的调解员的能力。",
    btn_text: "探索培训项目"
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
        },
        "about-page": {
          hero: {
            img_alt: "关于 PMA",
            eyebrow: "关于 PMA",
            title_part1: "构建一种专注于",
            title_part2: "对话、争端解决与相互理解的文化",
            lead: "巴基斯坦调解员协会 (PMA) 致力于通过专业培训、机构合作和国际认可的执业标准，在巴基斯坦全境推动调解和替代性争议解决 (ADR) 的发展。"
          },
          about: {
            hero_img_alt: "关于 PMA",
            hero_eyebrow: "关于 PMA",
            hero_title_part1: "构建一种专注于",
            hero_title_part2: "对话、争端解决与相互理解的文化",
            hero_lead: "巴基斯坦调解员协会 (PMA) 致力于通过专业培训、机构合作和国际认可的执业标准，在巴基斯坦全境推动调解和替代性争议解决 (ADR) 的发展。",
            badge_years: "周年",
            badge_stat_label: "推行卓越的 <br>调解服务",
            nav_tab1: "关于 PMA",
            nav_tab2: "我们的愿景",
            nav_tab3: "我们的使命",
            nav_tab4: "我们的影响",
            tab1_title1: "关于",
            tab1_title2: "PMA",
            tab1_text: "PMA 成立于 2013 年，并在巴基斯坦政府注册，是经英国有效争议解决中心 (CEDR) 授权在巴基斯坦开展 CEDR 模式调解培训的专业机构。<br><br>PMA 已于 2018 年与泰国仲裁中心签署了谅解备忘录，并与南亚区域合作联盟 (SAARC) 其他国家的机构保持着紧密的合作关系。<br><br>我们的协会由国际公认、经 CEDR 培训的主讲培训师和调解员组成。他们已成功为信德省、旁遮普省和伊斯兰堡 Jurisdictions 的法官和律师开展了多项培训计划，从而提高了该国调解的专业标准。",
            tab2_title1: "我们的",
            tab2_title2: "愿景",
            tab2_text: "将调解确立为巴基斯坦领先且最值得信赖的争议解决方式，促进建设性对话、相互理解和和平共处的文化。",
            tab3_title1: "我们的",
            tab3_title2: "使命",
            tab3_points: [
              "推动调解成为一种可及且有效的争议解决机制",
              "按照国际标准培训和认证调解员",
              "与法院、政府机构和私营部门开展紧密合作",
              "提高全社会对调解益处的认识"
            ],
            tab4_title1: "我们的",
            tab4_title2: "影响",
            tab4_text1: "PMA 已成功培训了数百名律师、法官和专业人士，并在推动巴基斯坦法院衔接调解工作方面发挥了关键作用。",
            tab4_text2: "我们继续与司法界及各利益相关方密切合作，以巩固调解作为可持续争议解决体系的地位。"
          },
          leadership: {
            title1: "领导团队",
            title2: "致辞",
            president: {
              name: "Aga Zafar Ahmad",
              role1: "巴基斯坦最高法院律师",
              role2: "主席",
              role3: "巴基斯坦调解员协会",
              heading: "主席致辞",
              quote: "调解不仅是一种专业工具，更是发展中法律体系 tank 必需品。",
              lead: "随着法律和商业环境的演变，替代性争议解决 (ADR) 在确保快速、公平和有效正义方面的作用从未像现在这样至关重要。作为主席，我的工作重点是扩大我们的影响力，确保调解成为我们法律体系的基石。",
              read_more: "阅读完整致辞",
              sign_role: "巴基斯坦最高法院律师<br>巴基斯坦调解员协会主席",
              popup: {
                p1: "有幸担任巴基斯坦调解员协会 (PMA) 主席，我深感荣幸。随着法律和商业环境的演变，替代性争议解决 (ADR) 在确保快速、公平和有效正义方面的作用从未像现在这样至关重要。",
                p2: "作为本协会的创始成员，我的历程源于一种信念：调解不仅是一种专业工具，更是发展中法律体系的必需品。展望未来，我的承诺是确保我们的协会成为一个更具活力和协作性的平台，架起传统诉讼与现代争议解决方式之间的桥梁。",
                p3: "自成立以来，PMA 一直致力于在巴基斯坦全境推广和规范调解实践。我们努力保持最高标准的专业操守，并为全国的调解员提供统一发声的平台。作为主席，我的工作重点是扩大我们的影响力，确保调解成为我们法律体系的基石，并被司法界和公众公认为促进社会与经济和谐的重要工具。",
                commit_heading: "我们致力于：",
                commit_list: [
                  "<strong>能力建设与专业发展：</strong> 继续为调解员提供高水平的培训和认证，以确保达到世界级的执业标准，使我们成员的技能始终处于行业前沿。",
                  "<strong>行业倡导：</strong> 与利益相关方和司法界紧密沟通，将调解引入并融入主流法律框架。",
                  "<strong>坚持创新：</strong> 采用现代技术和全球最佳实践，有效解决贸易、海事和商业冲突。",
                  "<strong>全国大会：</strong> 我们将努力组织定期集会，分享行业见解、庆祝成功，并加强我们在全国的共同发声。",
                  "<strong>加强协调：</strong> 我们致力于改善所有成员之间的沟通与参与，确保每种观点都能被倾听和重视。",
                  "<strong>扩大成员规模：</strong> 我们将积极欢迎新专业人士的加入，以扩大调解在巴基斯坦法律界和商界的影响力。",
                  "<strong>调解员行为准则：</strong> 此外，本届任期的一个核心重点是成立一个新委员会，专门负责与巴基斯坦律师理事会和各省律师理事会进行协调。该举措将专注于正式确立一套完善的《调解员行为准则》，确保我们的执业始终基于最高的道德和专业标准。"
                ],
                closing: "我邀请大家加入我们的使命，共同推进调解主流化，在巴基斯坦培育和谐与追求卓越专业的文化。"
              }
            },
            founding_president: {
              name: "Anwar Kashif Mumtaz",
              role1: "巴基斯坦最高法院律师",
              role2: "认证调解员",
              heading: "创始主席致辞",
              quote: "齐心协力，我们可以构建一种理解重于对抗的文化。",
              lead: "我们的使命是在我们挚爱的国家内推广调解，使其成为一种有效、合乎道德且易于获取的争议解决手段。",
              read_more: "阅读完整致辞",
              sign_role: "最高法院律师<br>认证调解员",
              popup: {
                p1: "今天，作为巴基斯坦调解员协会的创始主席，很高兴见证这一致力于对话和和平解决争议平台的成长。我们的使命是在我们挚爱的国家内推广调解，使其成为一种有效、合乎道德且易于获取的争议解决手段。我们依然致力于维护最高的专业标准，并增进对替代性争议解决机制的信任。",
                p2: "通过合作、培训和持续学习，我们旨在加强全国调解员的能力建设。",
                p3: "我鼓励所有利益相关方拥抱调解，将其作为补充司法体系、走向正义与和谐的建设性路径。",
                closing: "齐心协力，我们可以构建一种理解重于对抗的文化。"
              }
            },
            stats: {
              s1_title: "数百人受训",
              s1_text: "在巴基斯坦全境培训了数以百计的律师、法官和专业人士。",
              s2_title: "法院衔接调解",
              s2_text: "在全国范围内推广并强化法院衔接调解的各项举措。",
              s3_title: "紧密合作",
              s3_text: "与司法界和利益相关方密切合作，打造可持续的争议解决体系。"
            }
          },
          partners: {
            title: "我们的合作伙伴",
            p1: "信德省高等法院",
            p2: "政府机构",
            p3: "国际调解协会"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "调解咨询室",
            eyebrow: "调解服务 (Mediation)",
            title_part1: "化解矛盾争议 坚守",
            title_part2: "对话与相互理解",
            lead: "调解是一个自愿、保密且结构化的过程。在此过程中，中立的调解员将协助各方达成相互接受且可持续的解决方案。"
          },
          mediation: {
            title1: "什么是",
            title2: "调解？",
            text1: "调解是一个自愿、保密且结构化的过程。在此过程中，中立且公正的第三方——即调解员 (Mediator)——促进纠纷各方之间的对话，以帮助他们达成相互接受且可持续的解决方案。",
            text2: "与法庭訴訟不同，调解强调合作、自主决定和创造性地解决问题。它使各方能够在保持彼此关系的同时，获得更高效、更具成本效益的结果。",
            img_alt: "什么是调解"
          }, whyChoose: {
            heading_part1: "为什么选择 PMA 的",
            heading_part2: "调解服务",
            heading_part3: "？",
            cards: {
              card1: {
                title: "高效且极具成本效益",
                desc: "在数周内化解矛盾争议，而非耗费数年。"
              },
              card2: {
                title: "严格保密",
                desc: "私密安全的调解过程，不留任何公开记录。"
              },
              card3: {
                title: "维护彼此关系",
                desc: "专注于相互理解，寻求实现双赢的解决方案。"
              },
              card4: {
                title: "灵活且注重协作",
                desc: "争议各方对最终结果和决定拥有完全的控制权。"
              },
              card5: {
                title: "IMI 认证标准",
                desc: "国际公认的调解员专业资质认证。"
              }
            }
          },
          banner: {
            text: "PMA 是巴基斯坦<strong>首家且历史最悠久</strong>的致力于调解认证、专业培训和行业倡导的专职机构——<strong>成立于 2013–2014 年</strong>，总部位于卡拉奇。"
          },
          how_it_works: {
            title_part1: "调解服务如何",
            title_part2: "开展？",
            img_alt: "调解流程",
            steps: {
              step1: {
                num: "1",
                title: "提交您的申请",
                desc: "您联络 PMA 并提供您的争议细节信息。"
              },
              step2: {
                num: "2",
                title: "初步案件评估",
                desc: "我们评估相关事宜，并确定其是否适合通过调解解决。"
              },
              step3: {
                num: "3",
                title: "指定专属调解员",
                desc: "我们将为您的案件分配一位中立且具备专业资质的调解员。"
              },
              step4: {
                num: "4",
                title: "协助开展调解会",
                desc: "调解员将促进结构化对话，引导各方共同探索解决方案。"
              },
              step5: {
                num: "5",
                title: "达成共识与协议",
                desc: "争议各方达成相互接受的结果，并正式签署和解协议。"
              }
            }
          },
          who_we_serve: {
            heading_part1: "我们的",
            heading_part2: "服务对象",
            cards: {
              card1: {
                title: "个人与家庭",
                desc: "协助个人及家庭化解各类私人与民事纠纷。"
              },
              card2: {
                title: "企业与公司",
                desc: "支持各类商业机构解决商事及职场内部争议。"
              },
              card3: {
                title: "政府机构",
                desc: "协助政府部门高效解决公共服务领域的争端。"
              },
              card4: {
                title: "非政府组织与社区团体",
        desc: "促进社区及社会公益组织内部与外部的矛盾化解。"
      },
              card5: {
                title: "律师事务所与法律从业者",
                desc: "与法律界专业人士携手合作，提供高效的多样化纠纷解决机制（ADR）方案。"
              }
            }
  },
  cta: {
    title_part1: "让我们共同",
    title_part2: "和平化解争议。",
    subtitle: "调解凝聚共识，共识孕育方案。欢迎立即联络 PMA，了解调解服务如何为您提供协助。",
    btn_text: "立即联系我们"
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
          info_email_val: "info@pma.org.pk"
        },
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
    title_part1: "التدريب المهني و",
    title_part2: "الاعتماد (Accreditation)",
    text: "توفر PMA برامج تدريب وتطوير مهني متوافقة مع المعايير الدولية في مجال الوساطة، ومصممة خصيصاً للمحامين، ومحترفي الشركات، وفرق الموارد البشرية، والمعلمين، والوسطاء الطموحين.<br>تركز ورش العمل وبرامج الشهادات لدينا على مهارات حل النزاعات العملية، واستراتيجيات التفاوض، والتواصل، وأطر الحلول البديلة لتسوية النزاعات (ADR).",
    features: {
      feat1: "اعتماد IMI",
      feat2: "مدربون خبراء",
      feat3: "تعلم عملي",
      feat4: "معايير عالمية"
    },
    card_text: "تلبي برامجنا التدريبية المعايير الدولية وتمكن المحترفين من أن يصبحوا وسطاء فعالين وأخلاقيين ومؤهلين عالمياً.",
    btn_text: "استكشاف برامج التدريب"
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
          }
        },
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
        },
        "about-page": {
          hero: {
            img_alt: "د PMA په اړه",
            eyebrow: "د PMA په اړه",
            title_part1: "د داسې کلتور رامنځته کول",
            title_part2: "چې بنسټ یې په خبرو اترو، حل لارو او دوه اړخیزه تفاهم وي",
            lead: "د پاکستان منځګړو ټولنه (PMA) ژمنه ده چې د مسلکي روزنې, اداري همکارۍ، او په نړیواله کچه منل شویو معیارونو له لارې په ټول پاکستان کې منځګړیتوب او د شخړو متبادل حل (ADR) ته وده ورکړي."
          },
          about: {
            hero_img_alt: "د PMA په اړه",
            hero_eyebrow: "د PMA په اړه",
            hero_title_part1: "د داسې کلتور رامنځته کول",
            hero_title_part2: "چې بنسټ یې په خبرو اترو، حل لارو او دوه اړخیزه تفاهم وي",
            hero_lead: "د پاکستان منځګړو ټولنه (PMA) ژمنه ده چې د مسلکي روزنې، اداري همکارۍ، اور په نړیواله کچه منل شویو معیارونو له لارې په ټول پاکستان کې منځګړیتوب او د شخړو متبادل حل (ADR) ته وده ورکړي.",
            badge_years: "کاله",
            badge_stat_label: "د منځګړیتوب د عالي معیارونو <br>وده",
            nav_tab1: "د PMA په اړه",
            nav_tab2: "زموږ لیدلوری",
            nav_tab3: "زموږ ماموریت",
            nav_tab4: "زموږ اغېز",
            tab1_title1: "د PMA",
            tab1_title2: "په اړه",
            tab1_text: "PMA په 2013 کې تاسیس شوې او د پاکستان حکومت سره راجستر ده، PMA هغه مسلکي اداره ده چې د انګلستان د اغېزمنو شخړو حل مرکز (CEDR) لخوا اجازه ورکړل شوې ترڅو په پاکستان کې د CEDR ماډل منځګړیتوب روزنه وړاندې کړي.<br><br>PMA د تایلینډ د منځګړیتوب مرکز (2018) سره د تفاهم یادښت لاسلیک کړی او د سارک په نورو هیوادونو کې له بنسټونو سره قوي اړیکې پالي.<br><br>زموږ ټولنه په نړیواله کچه منل شوي د CEDR لخوا روزل شوي ماسټر ټرینرانو او منځګړو څخه جوړه ده چې په بریالیتوب سره یې په سند، پنجاب او اسلام آباد کې د قاضیانو او وکیلانو لپاره ډیری روزنیز پروګرامونه ترسره کړي دي.",
            tab2_title1: "زموږ",
            tab2_title2: "لیدلوری",
            tab2_text: "په پاکستان کې د شخړو د حل د ترټولو مخکښې او باوري طریقې په توګه د منځګړیتوب رامنځته کول، د رغنده خبرو اترو، دوه اړخیزه تفاهم او سوله ایز ژوند کلتور ته وده ورکول.",
            tab3_title1: "زموږ",
            tab3_title2: "ماموریت",
            tab3_points: [
              "منځګړیتوب ته د شخړو د حل د یوې اسانه او اغېزمنې لارې په توګه وده ورکول",
              "د نړیوالو معیارونو سره سم د منځګړو روزنه او تصدیق کول",
              "د محکمو، دولتي بنسټونو او خصوصي سکټورونو سره همکاري کول",
              "په ټولنه کې د منځګړیتوب د ګټو په اړه پوهاوی رامنځته کول"
            ],
            tab4_title1: "زموږ",
            tab4_title2: "اغېز",
            tab4_text1: "PMA په بریالیتوب سره په سلګونو وکیلان، قاضیان او مسلکي کسان روزلي او په پاکستان کې یې له محکمو سره د تړلي منځګړیتوب نوښتونو په وده کې مهم رول لوبولی دی.",
            tab4_text2: "موږ د قضایه قوې او شریکانو سره نږدې کار کولو ته دوام ورکوو ترڅو منځګړیتوب د شخړو د حل د یو باثباته سیسټم په توګه پیاوړی کړو."
          },
          leadership: {
            title1: "مشرتابه",
            title2: "پیغامونه",
            president: {
              name: "آغا ظفر احمد",
              role1: "د پاکستان د سترې محکمې (سپريم کورټ) وکیل",
              role2: "مشر (ولسمشر)",
              role3: "د پاکستان منځګړو ټولنه",
              heading: "د مشر پيغام",
              quote: "منځګړیتوب یوازې یو مسلکي وسیله نه ده، بلکې د پرمختلونکي قانوني سیسټم لپاره یو اړتیا ده.",
              lead: "لکه څنګه چې قانوني او سوداګریز چاپیریال بدلیږي، د ګړندي، عادلانه او اغېزمن انصاف په یقیني کولو کې د ADR رول هیڅکله دومره مهم نه و. د مشر په توګه زما پام زموږ د لاسرسي پراخولو باندې دی، ترڅو منځګړیتوب زموږ د قانوني چاپیریال یو بنسټیز ډبره شي.",
              read_more: "بشپړ پيغام لوستل",
              sign_role: "د پاکستان د سترې محکمې وکیل<br>مشر، د پاکستان منځګړو ټولنه",
              popup: {
                p1: "د پاکستان منځګړو ټولنې (PMA) د مشر په توګه خدمت کول یو لوی ویاړ دی. لکه څنګه چې قانوني او سوداګریز چاپیریال بدلیږي، د شخړو د متبادل حل (ADR) رول د ګړندي، عادلانه او اغېزمن انصاف په یقیني کولو کې د هر وخت په پرتله خورا مهم شوی دی.",
                p2: "د دې ټولنې د یو بنسټ اېښودونکي غړي په توګه زما سفر د دې باور لخوا پرمخ وړل شوی چې منځګړیتوب یوازې یو مسلکي وسیله نه ده، بلکې د یو پرمختلونکي قانوني سیسټم لپاره یوه جدي اړتیا ده. کله چې موږ راتلونکي ته ګورو، زما ژمنه دا ده چې ډاډ ترلاسه کړم چې زموږ ټولنه یو ډیر خوځنده او ګډ پلیټ فارم شي، چې د دودیزو محکمو او د شخړو د حل د عصري لارو ترمنځ د پله رول ولوبوي.",
                p3: "زموږ د تاسیس راهیسې، PMA په ټول پاکستان کې د منځګړیتوب د عمل دودولو او تنظیم کولو ته ځانګړې پاملرنه کړې ده. موږ هڅه کوو چې د مسلکي چلند ترټولو لوړ معیارونه وساتو او په ټول هیواد کې د منځګړو لپاره یو ګډ غږ چمتو کړو. د مشر په توګه زما تمرکز زموږ د لاسرسي په پراخولو دی، ترڅو ډاډ ترلاسه شي چې منځګړیتوب زموږ د قانوني سیسټم یو بنسټیز برخه شي، چې د عدلیې او عامو خلکو لخوا د ټولنیز او اقتصادي همغږۍ د یوې حیاتي وسیلې په توګه وپیژندل شي.",
                commit_heading: "موږ ژمن یو چې:",
                commit_list: [
                  "<strong>د وړتیاوو لوړول او مسلکي پراختیا:</strong> د منځګړو لپاره د لوړ کیفیت روزنې او تصدیق کولو اسانتیا ته دوام ورکول ترڅو د نړیوالې کچې معیارونه رامنځته شي او زموږ د غړو مهارتونه په صنعت کې ترټولو مخکښ وساتل شي.",
                  "<strong>وکالت (Advocacy):</strong> د شریکانو او عدلیې سره یوځای کار کول ترڅو منځګړیتوب په اصلي قانوني چوکاټ کې مدغم شي.",
                  "<strong>نوښت (Innovation):</strong> د سوداګریزو، سمندري او کښتیو شخړو په مؤثره توګه حل کولو لپاره د عصري تخنیکونو او نړیوالو غوره لارو کارول.",
                  "<strong>قومي کنوانسیونونه:</strong> موږ به هڅه وکړو چې په ټول هیواد کې د تجربو شریکولو، د بریالیتوبونو نمانځلو او زموږ د ګډ غږ پیاوړي کولو لپاره منظمې غونډې تنظیم کړو.",
                  "<strong>غوره همغږي:</strong> موږ د ټولو غړو ترمنځ د اړیکو او بوختیا ښه کولو ته ژمن یو ترڅو ډاډ ترلاسه شي چې د هرچا نظر اوریدل کیږي او ارزښت ورکول کیږي.",
                  "<strong>د غړیتوب وده:</strong> موږ به نوي مسلکي کسانو ته په تودوخې سره ښه راغلاست ووایو ترڅو د پاکستان په قانوني او سوداګریزو ټولنو کې د منځګړیتوب لاسرسی او نفوذ پراخ کړو.",
                  "<strong>د منځګړو لپاره د اخلاقي چلند ضابطه (Code of Conduct):</strong> سربیره پردې، د دې دورې یو مهم لومړیتوب د پاکستان بار کونسل او ولایتي بار کونسلونو سره د همغږۍ لپاره د یوې نوې کمیټې رامنځته کول دي. دا نوښت به د منځګړو لپاره د یوې قوي اخلاقي ضابطې په رسمي کولو تمرکز وکړي، ترڅو ډاډ ترلاسه شي چې زموږ کړنې په لوړو اخلاقي او مسلکي معیارونو ولاړې وي."
                ],
                closing: "زه له تاسو ټولو څخه غوښتنه کوم چې پدې ماموریت کې له موږ سره یوځای شئ ترڅو منځګړیتوب عام کړو او په پاکستان کې د همغږۍ او مسلکي عالي والي کلتور ته وده ورکړو."
              }
            },
            founding_president: {
              name: "انور کاشف ممتاز",
              role1: "د پاکستان د سترې محکمې وکیل",
              role2: "تصدیق شوی منځګړی (Accredited Mediator)",
              heading: "د بنسټ اېښودونکي مشر پيغام",
              quote: "په ګډه، موږ کولی شو داسې کلتور رامنځته کړو چې هلته د نښتې پر ځای تفاهم برلاسی وي.",
              lead: "زموږ ماموریت زموږ په ګران هیواد کې د شخړو د حل لپاره منځګړیتوب ته د یوې اخلاقي، اغېزمنې او اسانې لارې په توګه وده ورکول دي.",
              read_more: "بشپړ پيغام لوستل",
              sign_role: "د سترې محکمې وکیل<br>تصدیق شوی منځګړی",
              popup: {
                p1: "نن د پاکستان منځګړو ټولنې د بنسټ اېښودونکي مشر په توګه، زه ډیر خوښ یم چې د داسې یو پلیټ فارم د ودې شاهد یم چې د خبرو اترو او د شخړو سوله ایز حل ته وقف شوی دی. زموږ ماموریت زموږ په ګران هیواد کې د شخړو د حل لپاره د یوې اخلاقي او اسانې لارې په توګه د منځګړیتوب رامنځته کول دي. موږ د لوړو مسلکي معیارونو ساتلو او د شخړو د متبادل حل په لارو چارو د باور رامنځته کولو ته ژمن یو.",
                p2: "د همکارۍ، روزنې او دوامداره زده کړې له لارې، موږ موخه لرو چې په ټول هیواد کې د منځګړو وړتیاوې پیاوړې کړو.",
                p3: "زه ټول شریکان هڅوم چې منځګړیتوب د محکمو د ملاتړ او د عدالت او همغږۍ په لور د یوې رغندې لارې په توګه غوره کړي.",
                closing: "په ګډه، موږ کولی شو داسې کلتور رامنځته کړو چې هلته د نښتې پر ځای تفاهم برلاسی وي."
              }
            },
            stats: {
              s1_title: "په سلګونو روزل شوي",
              s1_text: "په ټول پاکستان کې وکیلان، قاضیان او مسلکي کسان روزل شوي دي.",
              s2_title: "له محکمو سره تړلی منځګړیتوب",
              s2_text: "په ټول هیواد کې د منځګړیتوب نوښتونو ته وده ورکول او پیاوړي کول.",
              s3_title: "قوي همکاري",
              s3_text: "د شخړو د حل د یو باثباته سیسټم لپاره د عدلیې او شریکانو سره نږدې کار کول."
            }
          }
        }, "mediation-page": {
          hero: {
            img_alt: "د منځګړیتوب د مشورې خونه",
            eyebrow: "منځګړیتوب (Mediation)",
            title_part1: "د شخړو حل لاره لټول",
            title_part2: "د خبرو اترو او دوه اړخیزه تفاهم له لارې",
            lead: "منځګړیتوب یو داوطلبانه، پټ او منظم بهیر دی چیرې چې یو بې طرفه منځګړی د ښکیلو غاړو سره مرسته کوي ترڅو دوه اړخیزه د منلو وړ او باثباته حل لارې ته ورسیږي."
          },
          mediation: {
            title1: "منځګړیتوب",
            title2: "څه شی دی؟",
            text1: "منځګړیتوب یو داوطلبانه، پټ او منظم بهیر دی چې پکې یو بې طرفه او ناپیيلې دریمه ډله — یعنې منځګړی (Mediator) — د شخړې د ښکیلو غاړو ترمنځ خبرې اترې اسانه کوي ترڅو هغوی وکولی شي د دوه اړخیزه د منلو وړ او باثباته حل لارې ته ورسیږي.",
            text2: "د محکمو د اوږدو جنجالونو برعکس، منځګړیتوب په ګډه همکارۍ، خپلواکې پرېکړې، او د ستونزو په تعميري حل ټینګار کوي. دا ښکيلو غاړو ته دا وړتیا ورکوي چې د خپلمنځي اړیکو د ساتلو ترڅنګ، په ګړندۍ او خورا لږ لګښت سره پایلې ترلاسه کړي.",
            img_alt: "منځګړیتوب څه شی دی"
          }, whyChoose: {
            heading_part1: "د PMA سره",
            heading_part2: "منځګړیتوب",
            heading_part3: "ولې غوره کړئ؟",
            cards: {
              card1: {
                title: "ګړندی او لږ لګښت لرونکی",
                desc: "د کلونو پر ځای په څو اونیو کې شخړې حل کړئ."
              },
              card2: {
                title: "پټ او محرم",
                desc: "بې له کوم عامه ریکارډ څخه یو شخصي او خوندي بهیر."
              },
              card3: {
                title: "د اړیکو ساتل",
                desc: "په دوه اړخیزه تفاهم او د دواړو خواوو په ګټه (win-win) حل لارو تمرکز."
              },
              card4: {
                title: "انعطاف منونکی او ګډ کار",
                desc: "ښکیلې غاړې په پایلو او پرېکړو بشپړ کنټرول لري."
              },
              card5: {
                title: "د IMI لخوا تایید شوي معیارونه",
                desc: "د منځګړو لپاره په نړیواله کچه منل شوي اعتبارپاڼې."
              }
            }
          },
          banner: {
            text: "PMA د منځګړیتوب د اعتبار، مسلکي روزنې، او وکالت لپاره د پاکستان <strong>لومړنۍ او تر ټولو پخوانۍ</strong> ځانګړې اداره ده — چې په <strong>2013–2014 کې تاسیس شوې</strong> او په کراچۍ کې موقعیت لري."
          },
          how_it_works: {
            title_part1: "منځګړیتوب څنګه",
            title_part2: "کار کوي؟",
            img_alt: "د منځګړیتوب پروسه",
            steps: {
              step1: {
                num: "۱",
                title: "خپله غوښتنه وسپارئ",
                desc: "تاسو د خپلې شخړې د جزیاتو شریکولو لپاره د PMA سره اړیکه ونیسئ."
              },
              step2: {
                num: "۲",
                title: "د قضیې لومړنۍ ارزونه",
                desc: "موږ موضوع ارزوو او د منځګړیتوب لپاره د هغې وړتیا ټاکو."
              },
              step3: {
                num: "۳",
                title: "د منځګړي (Mediator) ټاکل",
                desc: "ستاسو قضیې ته یو بې طرفه او وړ منځګړی ټاکل کیږي."
              },
              step4: {
                num: "۴",
                title: "تنظیم شوي ناستې (Sessions)",
                desc: "منځګړی د حل لارو موندلو لپاره د جوړښت شوي او ګټور ډیالوګ زمینه برابروي."
              },
              step5: {
                num: "۵",
                title: "تصفیه او هوکړه لیک",
                desc: "ښکیلې غاړې دوه اړخیزې د منلو وړ پایلې ته رسیږي او هوکړه لیک رسمي کوي."
              }
            }
          },
          who_we_serve: {
    heading_part1: "موږ چا ته",
    heading_part2: "خدمت کوو",
    cards: {
      card1: {
        title: "افراد او کورنۍ",
        desc: "د شخصي او مدني شخړو په هواري کې د افرادو او کورنیو سره مرسته کول."
      },
      card2: {
        title: "سوداګرۍ او کارپوریشنونه",
        desc: "د سوداګریزو او کار ځای د شخړو په حل کې د سوداګریزو ادارو ملاتړ کول."
      },
      card3: {
        title: "دولتي ادارې",
        desc: "د عامه سکتور د شخړو په حل کې د دولتي څانګو سره مرسته کول."
      },
      card4: {
        title: "این جی اوز او د ټولنې تنظیمونه",
        desc: "د ټولنیزو او عامه کچې سازمانونو لپاره د شخړو حل کول اسانول."
      },
      card5: {
        title: "د قانون شرکتونه او حقوقي متخصصین",
        desc: "د اغېزمنو ADR حل لارو لپاره د حقوقي متخصصینو سره ملګرتیا کول."
      }
    }
  },
  cta: {
    title_part1: "راځئ چې شخړې حل کړو",
    title_part2: "په سوله ییزه توګه.",
    subtitle: "منځګړیتوب تفاهم رامنځته کوي. تفاهم حل لارې لټوي. نن ورځ د PMA سره اړیکه ونیسئ ترڅو پوه شئ چې منځګړیتوب څنګه ستاسو سره مرسته کولی شي.",
    btn_text: "نن ورځ له موږ سره اړیکه ونیسئ"
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
          info_email_val: "info@pma.org.pk"
        },
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
    title_part1: "پروفيشنل تربيت ۽",
    title_part2: "توثيق (Accreditation)",
    text: "PMA بين الاقوامي معيارن جي مطابق مصالحت جي تربيت ۽ پروفيشنل ڊيولپمينٽ پروگرام فراهم ڪري ٿي جيڪي وڪيلن، ڪارپوريٽ پيشيور ماڻهن، HR ٽيمن، استادن، ۽ ثالث بڻجڻ جي خواهش رکندڙن لاءِ تيار ڪيا ويا آهن.<br>اسان جا ورڪشاپ ۽ سرٽيفڪيشن پروگرام تڪرارن جي عملي حل جي مهارتن، ڳالهه ٻولهه جي حڪمت عملين، رابطي ۽ ADR فريم ورڪ تي ڌيان ڏين ٿا.",
    features: {
      feat1: "IMI توثيق (Accreditation)",
      feat2: "ماهر ٽرينرز",
      feat3: "عملي سکيا",
      feat4: "عالمهي معيار"
    },
    card_text: "اسان جا تربيتي پروگرام بين الاقوامي معيارن تي پورو لهن ٿا ۽ پيشيور ماڻهن کي مؤثر، اخلاقي، ۽ عالمي سطح تي قابل ثالث (Mediators) بڻجڻ لاءِ بااختيار بڻائين ٿا.",
    btn_text: "تربيت جا پروگرام دريافت ڪريو"
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
          }
        },
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
        },
        "about-page": {
          hero: {
            img_alt: "PMA بابت",
            eyebrow: "PMA بابت",
            title_part1: "هڪ اهڙي ثقافت جي تعمير",
            title_part2: "ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي",
            lead: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) پروفيشنل تربيت، اداراتي تعاون، ۽ بين الاقوامي سطح تي تسليم ٿيل معيارن جي ذريعي پوري پاڪستان ۾ ميڊئيشن (مصالحت) ۽ متبادل تڪرارن جي حل (ADR) کي هٿي ڏيڻ لاءِ پرعزم آهي."
          },
          about: {
            hero_img_alt: "PMA بابت",
            hero_eyebrow: "PMA بابت",
            hero_title_part1: "هڪ اهڙي ثقافت جي تعمير",
            hero_title_part2: "ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي",
            hero_lead: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) پروفيشنل تربيت، اداراتي تعاون، ۽ بين الاقوامي سطح تي تسليم ٿيل معيارن جي ذريعي پوري پاڪستان ۾ ميڊئيشن (مصالحت) ۽ متبادل تڪرارن جي حل (ADR) کي هٿي ڏيڻ لاءِ پرعزم آهي .",
            badge_years: "سال",
            badge_stat_label: "مصالحتي مهارت کي <br>هٿي ڏيڻ",
            nav_tab1: "PMA بابت",
            nav_tab2: "اسان جو ويزن",
            nav_tab3: "اسان جو مشن",
            nav_tab4: "اسان جو اثر",
            tab1_title1: "PMA",
            tab1_title2: "بابت",
            tab1_text: "PMA 2013 ۾ قائم ٿي ۽ پاڪستان حڪومت سان رجسٽرڊ آهي، PMA اهو پروفيشنل ادارو آهي جنهن کي سينٽر فار ايفيڪٽو ڊسپيوٽ ريزوليوشن (CEDR)، برطانيه پاران پاڪستان ۾ CEDR ماڊل جي مصالحتي تربيت فراهم ڪرڻ جو اختيار ڏنو ويو آهي.<br><br>PMA ٿائيلينڊ آربيٽريشن سينٽر (2018) سان هڪ مفاهمتي ياداشت تي دستخط ڪيا آهن ۽ ٻين سارڪ ملڪن جي ادارن سان مضبوط لاڳاپا برقرار رکيا آهن.<br><br>اسان جي ايسوسيئيشن بين الاقوامي سطح تي تسليم ٿيل CEDR مان تربيت يافته ماسٽر ٽرينرز ۽ مصالحت ڪندڙن تي مشتمل آهي، جن سنڌ، پنجاب ۽ اسلام آباد ۾ ججن ۽ وڪيلن لاءِ ڪيترائي تربيتي پروگرام ڪاميابيءَ سان هلايا آهن، جنهن سان ملڪ ۾ مصالحت جا پروفيشنل معيار بلند ٿيا آهن.",
            tab2_title1: "اسان جو",
            tab2_title2: "ويزن",
            tab2_text: "پاڪستان ۾ تڪرارن جي حل جي سڀ کان نمايان ۽ معتبر طريقي جي طور تي مصالحت (Mediation) کي قائم ڪرڻ، تعميري ڳالهين، باهمي افهام و تفهيم ۽ پرامن گڏيل بقا جي ثقافت کي هٿي ڏيڻ.",
            tab3_title1: "اسان جو",
            tab3_title2: "مشن",
            tab3_points: [
              "مصالحت کي تڪرارن جي حل جي هڪ آسان ۽ مؤثر طريقي جي طور تي هٿي ڏيڻ",
              "بين الاقوامي معيارن جي مطابق مصالحت ڪندڙن (Mediators) کي تربيت ڏيڻ ۽ انهن جي تصديق ڪرڻ",
              "عدالتن، حڪومتي ادارن ۽ نجي شعبن سان تعاون ڪرڻ",
              "پوري معاشري ۾ مصالحت جي فائدن بابت آگاهي پيدا ڪرڻ"
            ],
            tab4_title1: "اسان جو",
            tab4_title2: "اثر",
            tab4_text1: "PMA سوين وڪيلن، ججن ۽ پروفيشنلز کي ڪاميابيءَ سان تربيت ڏني آهي ۽ پاڪستان ۾ عدالتن سان لاڳاپيل مصالحتي قدمن کي هٿي ڏيڻ ۾ اهم ڪردار ادا ڪيو آهي.",
            tab4_text2: "اسان مصالحت کي هڪ پائيدار تڪرارن جي حل جي نظام جي طور تي مضبوط ڪرڻ لاءِ عدليه ۽ اسٽيڪ هولڊرز سان گڏجي ڪم جاري رکيو پيا اچون."
          },
          leadership: {
            title1: "قيادت",
            title2: "پيغام",
            president: {
              name: "آغا ظفر احمد",
              role1: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان",
              role2: "صدر",
              role3: "پاڪستان ميڊئيٽرز ايسوسيئيشن",
              heading: "صدر جو پيغام",
              quote: "مصالحت صرف هڪ پروفيشنل اوزار ناهي، پر هڪ ترقي پذير قانوني نظام لاءِ هڪ ضرورت آهي.",
              lead: "جيئن جيئن قانوني ۽ تجارتي ماحول تبديل ٿي رهيو آهي، تيئن تيز، منصفاڻي ۽ اثرائتي انصاف کي يقيني بڻائڻ ۾ ADR جو ڪردار ڪڏهن به ايترو اهم ناهي رهيو. صدر جي حيثيت ۾ منهنجو ڌيان اسان جي پهچ کي وڌائڻ آهي، ته جيئن مصالحت اسان جي قانوني نظام جو بنيادي پٿر بڻجي وڃي.",
              read_more: "پورو پيغام پڙهو",
              sign_role: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان<br>صدر، پاڪستان ميڊئيٽرز ايسوسيئيشن",
              popup: {
                p1: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) جي صدر جي حيثيت سان خدمتون سرانجام ڏيڻ هڪ وڏو اعزاز آهي. جيئن ته قانوني ۽ تجارتي ماحول تبديل ٿي رهيو آهي، متبادل تڪرارن جي حل (ADR) جو ڪردار تيز، منصفاڻي ۽ اثرائتي انصاف کي يقيني بڻائڻ ۾ ڪڏهن به ايترو اهم ناهي رهيو.",
                p2: "هن ايسوسيئيشن جي هڪ باني ميمبر جي حيثيت سان منهنجو سفر ان يقين سان رهيو آهي ته مصالحت صرف هڪ پروفيشنل اوزار ناهي، پر هڪ ترقي پذير قانوني نظام لاءِ هڪ ضرورت آهي. جڏهن اسان مستقبل ڏانهن ڏسون ٿا، منهنجو عزم اهو آهي ته اسان جي ايسوسيئيشن کي هڪ وڌيڪ متحرڪ ۽ تعاون وارو پليٽ فارم بڻايو وڃي، جيڪو روايتي عدالتن ۽ جديد تڪرارن جي حل جي وچ ۾ هڪ پل جو ڪردار ادا ڪري.",
                p3: "اسان جي شروعات کان وٺي، PMA پوري پاڪستان ۾ مصالحت جي عمل کي فروغ ڏيڻ ۽ منظم ڪرڻ لاءِ وقف آهي. اسان پروفيشنل اخلاقيات جي اعليٰ معيارن کي برقرار رکڻ ۽ سڄي ملڪ جي مصالحت ڪندڙن لاءِ هڪ گڏيل آواز مهيا ڪرڻ جي ڪوشش ڪندا آهيون. صدر جي حيثيت ۾ منهنجو مقصد اسان جي پهچ کي وڌائڻ آهي، انهي ڳالهه کي يقيني بڻائڻ ته مصالحت اسان جي قانوني نظام جو هڪ بنيادي حصو بڻجي وڃي، جنهن کي عدليه ۽ عوام ٻئي سماجي ۽ اقتصادي هم آهنگي لاءِ هڪ اهم اوزار طور تسليم ڪن.",
                commit_heading: "اسان ان لاءِ پرعزم آهيون:",
                commit_list: [
                  "<strong>صلاحيتن جي اڏاوت ۽ پروفيشنل ترقي:</strong> مصالحت ڪندڙن لاءِ اعليٰ معيار جي تربيت ۽ تصديق کي جاري رکڻ ته جيئن عالمي معيار جي عمل کي يقيني بڻائي سگهجي ۽ اسان جي ميمبرن جي مهارتن کي انڊسٽري ۾ سڀ کان اڳتي رکيو وڃي.",
                  "<strong>وکالت (Advocacy):</strong> اسٽيڪ هولڊرز ۽ عدليه سان گڏجي ڪم ڪرڻ ته جيئن مصالحت کي بنيادي قانوني فريم ورڪ جو حصو بڻائي سگهجي.",
                  "<strong>جدت (Innovation):</strong> تجارتي، سامونڊي ۽ ڪاروباري تڪرارن کي مؤثر طريقي سان حل ڪرڻ لاءِ جديد طريقن ۽ عالمي بهترين عملن کي اپنائڻ.",
                  "<strong>قومي ڪنوينشن:</strong> اسان سڄي ملڪ ۾ تجربا شيئر ڪرڻ، ڪاميابين جو جشن ملهائڻ، ۽ پنهنجي گڏيل آواز کي مضبوط ڪرڻ لاءِ باقاعدي گڏجاڻيون منظم ڪرڻ جي ڪوشش ڪنداسين.",
                  "<strong>بهترين هماهنگي:</strong> اسان سڀني ميمبرن جي وچ ۾ رابطي ۽ مصروفيت کي بهتر بڻائڻ لاءِ وقف آهيون ته جيئن هر نقطه نظر کي ٻڌو ۽ اهميت ڏني وڃي.",
                  "<strong>ميمبرشپ ۾ واڌارو:</strong> اسان پاڪستان جي قانوني ۽ ڪاروباري برادرين ۾ مصالحت جي پهچ ۽ اثر کي وڌائڻ لاءِ نون پروفيشنلز کي دل سان ڀليڪار ڪنداسين.",
                  "<strong>مصالحت ڪندڙن لاءِ اخلاقي ضابطو (Code of Conduct):</strong> ان کان علاوه، هن مدت جي هڪ اهم ترجيح پاڪستان بار ڪائونسل ۽ صوبائي بار ڪائونسلن سان هماهنگي لاءِ هڪ نئين ڪميٽي قائم ڪرڻ آهي. هي قدم مصالحت ڪندڙن لاءِ هڪ مضبوط اخلاقي ضابطي کي باقاعدي بڻائڻ تي ڌيان ڏيندو، انهي ڳالهه کي يقيني بڻائڻ ته اسان جو عمل اعليٰ اخلاقي ۽ پروفيشنل معيارن تي قائم رهي."
                ],
                closing: "مان توهان سڀني کي دعوت ڏيان ٿو ته اسان سان گڏ هن مشن ۾ شامل ٿيو ته جيئن مصالحت کي عام ڪيو وڃي ۽ پاڪستان ۾ هم آهنگي ۽ پروفيشنل مهارت جي ثقافت کي هٿي ڏني وڃي."
              }
            },
            founding_president: {
              name: "انور ڪاشف ممتاز",
              role1: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان",
              role2: "تصديق ٿيل مصالحت ڪندڙ (Accredited Mediator)",
              heading: "باني صدر جو پيغام",
              quote: "گڏجي، اسان هڪ اهڙي ثقافت تعمير ڪري سگهون ٿا جتي جهڳڙي جي ڀيٽ ۾ افهام و تفهيم کي فوقيت حاصل هجي.",
              lead: "اسان جو مشن اسان جي پياري ملڪ ۾ تڪرارن جي حل لاءِ مصالحت کي هڪ اخلاقي، اثرائتي ۽ آسان طريقي جي طور تي فروغ ڏيڻ آهي.",
              read_more: "پورو پيغام پڙهو",
              sign_role: "ايڊووڪيٽ سپريم ڪورٽ<br>تصديق ٿيل مصالحت ڪندڙ",
              popup: {
                p1: "اڄ، پاڪستان ميڊئيٽرز ايسوسيئيشن جي باني صدر جي حيثيت سان، مان هڪ اهڙي پليٽ فارم جي ترقيءَ کي ڏسي ڏاڍو خوش ٿيو آهيان جيڪو ڳالهين ۽ پرامن تڪرارن جي حل لاءِ وقف آهي. اسان جو مشن اسان جي پياري ملڪ ۾ تڪرارن جي حل لاءِ مصالحت کي هڪ اخلاقي ۽ آسان طريقي جي طور تي فروغ ڏيڻ آهي. اسان اعليٰ پروفيشنل معيارن کي برقرار رکڻ ۽ متبادل تڪرارن جي حل جي طريقن تي اعتماد وڌائڻ لاءِ پرعزم آهيون.",
                p2: "تعاون، تربيت ۽ مسلسل سکيا جي ذريعي، اسان جو مقصد سڄي ملڪ ۾ مصالحت ڪندڙن جي صلاحيتن کي مضبوط ڪرڻ آهي.",
                p3: "مان سڀني اسٽيڪ هولڊرز کي حوصلا افزائي ڪريان ٿو ته اهي مصالحت کي عدالتن جي مدد ۽ انصاف ۽ هم آهنگي جي هڪ تعميري رستي طور اپنائين.",
                closing: "گڏجي، اسان هڪ اهڙي ثقافت تعمير ڪري سگهون ٿا جتي جهڳڙي جي ڀيٽ ۾ افهام و تفهيم کي فوقيت حاصل هجي."
              }
            },
            stats: {
              s1_title: "سوين تربيت يافته",
              s1_text: "پوري پاڪستان ۾ وڪيلن، ججن ۽ پروفيشنلز کي تربيت ڏني وئي.",
              s2_title: "عدالتن سان لاڳاپيل مصالحت",
              s2_text: "سڄي ملڪ ۾ مصالحت جي قدمن کي فروغ ڏيڻ ۽ مضبوط ڪرڻ.",
              s3_title: "مضبوط تعاون",
              "s3_text": "تڪرارن جي حل جي هڪ پائيدار نظام لاءِ عدليه ۽ اسٽيڪ هولڊرز سان گڏجي ڪم ڪرڻ."
            }
          },
          partners: {
            title: "اسان جا پارٽنرز",
            p1: "سنڌ هاءِ ڪورٽ",
            p2: "سرڪاري ادارا",
            p3: "انٽرنيشنل ميڊئيشن انسٽيٽيوٽ"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "مصالحتي مشورتي ڪمرو",
            eyebrow: "مصالحت (Mediation)",
            title_part1: "تڪرارن جو حل ڳوليو",
            title_part2: "ڳالهين ۽ باهمي افهام و تفهيم جي ذريعي",
            lead: "مصالحت هڪ رضاڪارانه، بااعتماد ۽ منظم عمل آهي جتي هڪ غير جانبدار ثالث ڌرين کي باهمي طور تي قابل قبول ۽ پائيدار حل تائين پهچڻ ۾ مدد ڪندو آهي."
          },
          mediation: {
            title1: "مصالحت (Mediation)",
            title2: "ڇا آهي؟",
            text1: "مصالحت هڪ رضاڪارانه، بااعتماد ۽ منظم عمل آهي جنهن ۾ هڪ غير جانبدار ۽ بي لوث ٽيون ڌر — يعني ثالث (Mediator) — تڪراري ڌرين جي وچ ۾ ڳالهه ٻولهه کي آسان بڻائيندو آهي ته جيئن اهي باهمي طور تي قابل قبول ۽ پائيدار حل تائين پهچي سگهن.",
            text2: "عدالتي ڪارروائي (Litigation) جي برعڪس، مصالحت باهمي تعاون، پنهنجي مرضي، ۽ تعميري طريقي سان مسئلن کي حل ڪرڻ تي زور ڏئي ٿي. هي ڌرين کي پاڻ ۾ لاڳاپا برقرار رکڻ سان گڏوگڏ تيزيءَ سان ۽ انتهائي گهٽ خرچ ۾ نتيجا حاصل ڪرڻ جي قابل بڻائي ٿي.",
            img_alt: "مصالحت ڇا آهي"
          }, whyChoose: {
            heading_part1: "PMA سان",
            heading_part2: "مصالحت",
            heading_part3: "ڇو چونڊيو؟",
            cards: {
              card1: {
                title: "تيز تر ۽ انتهائي گهٽ خرچ",
                desc: "برسن جي بدران چند هفتن ۾ تڪرارن جو حل ماڻيو."
              },
              card2: {
                title: "مڪمل رازداري",
                desc: "بغير ڪنهن عوامي رڪارڊ جي هڪ نجي ۽ محفوظ عمل."
              },
              card3: {
                title: "لاڳاپن کي برقرار رکڻ",
                desc: "باهمني افهام و تفهيم ۽ ٻنهي ڌرين جي ڪاميابيءَ (win-win) تي ڌيان."
              },
              card4: {
                title: "لچڪدار ۽ باهمي تعاون",
                desc: "نتيجڻ ۽ فيصلن تي ڌرين جو پنهنجو مڪمل اختيار."
              },
              card5: {
                title: "IMI پاران تصديق ٿيل معيار",
                desc: "ثالثن (Mediators) لاءِ بين الاقوامي سطح تي تسليم ٿيل اسناد."
              }
            }
          },
          banner: {
            text: "PMA ثالثي جي توثيق، پروفيشنل تربيت، ۽ وکالت لاءِ پاڪستان جي <strong>پهرين ۽ سڀ کان پراڻي</strong> سرشار تنظيم آهي — جيڪا <strong>2013–2014 ۾ قائم ٿي</strong> ۽ ڪراچي ۾ ٻڌل آهي."
          },
          how_it_works: {
            title_part1: "مصالحت ڪيئن",
            title_part2: "ڪم ڪندي آهي؟",
            img_alt: "مصالحت جو عمل",
            steps: {
              step1: {
                num: "۱",
                title: "پنهنجي درخواست جمع ڪرايو",
                desc: "توهان پنهنجي تڪرار جي تفصيلن کي شيئر ڪرڻ لاءِ PMA سان رابطو ڪريو ٿا."
              },
              step2: {
                num: "۲",
                title: "ڪيس جو ابتدائي جائزو",
                desc: "اسان معاملي جو جائزو وٺون ٿا ۽ مصالحت لاءِ ان جي موزونيت جو تعين ڪريون ٿا."
              },
              step3: {
                num: "۳",
                title: "ثالث (Mediator) جو تعين",
                desc: "توهان جي ڪيس لاءِ هڪ غير جانبدار ۽ اهل ثالث مقرر ڪيو ويندو آهي."
              },
              step4: {
                num: "۴",
                title: "سهولتي سيزنز (Sessions)",
                desc: "ثالث حل ڳولڻ لاءِ منظم ۽ تعميري ڳالهه ٻولهه جي سهولت فراهم ڪندو آهي."
              },
              step5: {
                num: "۵",
                title: "تصفيو ۽ معاهدو",
                desc: "ڌريون هڪ باهمي طور تي قابل قبول نتيجي تي پهچن ٿيون ۽ معاهدي کي رسمي شڪل ڏين ٿيون."
              }
            }
          },
          who_we_serve: {
            heading_part1: "اسان ڪنهن کي",
            heading_part2: "خدمتون فراهم ڪيون ٿا",
            cards: {
              card1: {
                title: "افراد ۽ خاندان",
                desc: "فرد ن ۽ خاندانن کي سندن ذاتي ۽ ديواني (civil) تڪرارن کي حل ڪرڻ ۾ مدد ڪرڻ."
              },
              card2: {
                title: "کاروبار ۽ ڪارپوريشنون",
                desc: "تجارتي ۽ ڪم واري جڳهه جي تڪرارن کي حل ڪرڻ ۾ کاروباري ادارن جي مدد ڪرڻ."
              },
              card3: {
                title: "سرڪاري ادارا",
                desc: "پبلڪ سيڪٽر جي تڪرارن کي حل ڪرڻ ۾ سرڪاري کاتن جي مدد ڪرڻ."
              },
              card4: {
                title: "اين جي اوز ۽ ڪميونٽي تنظيمون",
                desc: "ڪميونٽي ۽ سماجي تنظيمن لاءِ تڪرارن جي حل کي آسان بڻائڻ."
              },
              card5: {
                title: "لا فرمز ۽ قانوني ماهر",
                desc: "مؤثر ADR حلن لاءِ قانوني ماهرن سان ڀاڱيوالي (شراڪت داري) ڪرڻ."
              }
            }
          },
  cta: {
    title_part1: "اچو ته تڪرارن جو حل ڳوليون",
    title_part2: "امن امان سان.",
    subtitle: "مصالحت باهمي افهام و تفهيم پيدا ڪندي آهي. افهام و تفهيم مان حل نڪرندا آهن. اڄ ئي PMA سان رابطو ڪريو ته جيئن معلوم ٿئي ته مصالحت توهان جي ڪيئن مدد ڪري سگهي ٿي.",
    btn_text: "اڄ ئي اسان سان رابطو ڪريو"
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

    // Force a synchronous reflow so the browser recalculates all layout
    // dimensions immediately. Without this, stale cached heights from the
    // previous dir/gutter state cause phantom scroll space below the footer.
    void document.documentElement.offsetHeight;
  }

  // Force a complete layout recalculation: reset body height, trigger resize,
  // and scroll to top so that no stale cached dimensions persist.
  function forceLayoutRecalculation() {
    // 1. Temporarily clear any explicit/cached heights on body and html
    document.body.style.minHeight = '';
    document.body.style.height = '';
    document.documentElement.style.height = '';

    // 2. Force synchronous reflow
    void document.body.offsetHeight;

    // 3. Scroll to current position (preserves user position but forces
    //    the browser to recalculate scroll boundaries)
    window.scrollTo(window.scrollX, window.scrollY);

    // 4. Fire resize event so any JS that caches heights (e.g. WOW.js,
    //    sticky headers, parallax) will recalculate
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (e) {
      // IE11 fallback
      var evt = document.createEvent('Event');
      evt.initEvent('resize', true, true);
      window.dispatchEvent(evt);
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
          // Release the scroll lock after the new layout has painted,
          // then force a full layout recalculation to eliminate phantom scroll
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.documentElement.classList.remove('lang-switching');
              forceLayoutRecalculation();
            });
          });
        };

        tempLink.onload = finalize;
        tempLink.onerror = finalize;

        document.head.appendChild(tempLink);
      } else {
        applyDirection(isRTL);
        forceLayoutRecalculation();
      }
    } else {
      applyDirection(isRTL);
      forceLayoutRecalculation();
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


  // Helper: resolves translation keys with namespace-aware fallbacks.
  // Supports direct keys (e.g., "about-page.hero.eyebrow") and legacy flat keys.
  function translateKey(key, options) {
    if (!key) return '';

    // 1. Try directly (handles prefixed keys like "about-page.X" or "home-page.X")
    let res = window.i18next.t(key, options);
    if (res !== key && res !== undefined && res !== null) {
      return res;
    }

    // 2. Try with "home-page." prefix (legacy home page keys stored under namespace)
    const prefixedKey = 'home-page.' + key;
    let prefixedRes = window.i18next.t(prefixedKey, options);
    if (prefixedRes !== prefixedKey && prefixedRes !== undefined && prefixedRes !== null) {
      return prefixedRes;
    }

    // 3. Strip known prefixes and try flat lookup (graceful fallback)
    const prefixes = ['home-page.', 'about-page.'];
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        const flatKey = key.slice(prefix.length);
        let flatRes = window.i18next.t(flatKey, options);
        if (flatRes !== flatKey && flatRes !== undefined && flatRes !== null) {
          return flatRes;
        }
      }
    }

    return res;
  }

  // Apply translations to all DOM elements
  function translatePage() {
    // 1. Translate elements with data-i18n attributes (plain text)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translated = translateKey(key);

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
      el.innerHTML = translateKey(key);
    });

    // 3. Translate footer list elements (data-i18n-list)
    //    Supports two list types:
    //    - "link"  → items are objects with { label, link }
    //    - "plain" → items are plain strings
    document.querySelectorAll('[data-i18n-list]').forEach(ul => {
      const key = ul.getAttribute('data-i18n-list');
      const listType = ul.getAttribute('data-i18n-list-type') || 'plain';
      if (!key) return;

      const items = translateKey(key, { returnObjects: true });
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
        } else if (listType === 'span' || listType === 'list-item') {
          const text = typeof item === 'string' ? item : String(item);
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li>${iconHtml}<span>${text}</span></li>`;
        } else {
          // plain string
          const text = typeof item === 'string' ? item : String(item);
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li>${iconHtml}${text}</li>`;
        }
      }).join('\n');
    });

    // 4. Translate attribute values (finds all data-i18n-attr-* attributes and sets the target attribute)
    // E.g., data-i18n-attr-alt="key" -> sets alt="translated"
    // E.g., data-i18n-attr-data-popup-quote="key" -> sets data-popup-quote="translated"
    const attrPrefix = 'data-i18n-attr-';
    document.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith(attrPrefix)) {
          const targetAttr = attr.name.slice(attrPrefix.length);
          const translationKey = attr.value;
          if (translationKey) {
            el.setAttribute(targetAttr, translateKey(translationKey));
          }
        }
      });
    });

    // 5. Translate header links using automated selector mapping (failsafe fallback)
    headerTranslationMap.forEach(({ selector, key }) => {
      document.querySelectorAll(selector).forEach(el => {
        // Only override text if it does not already have a translation attribute
        if (!el.hasAttribute('data-i18n') && !el.hasAttribute('data-i18n-html')) {
          el.textContent = translateKey(key);
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

            // Final safety: schedule another layout recalculation after
            // all DOM mutations and style recalcs from translation have settled.
            // This catches any edge cases where translated text changes element
            // heights and the previous recalc happened too early.
            setTimeout(function () {
              forceLayoutRecalculation();
            }, 350);
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
