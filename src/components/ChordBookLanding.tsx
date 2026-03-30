import React from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Zap, 
  Music, 
  Sliders, 
  Palette, 
  ListMusic, 
  Cpu,
  ChevronLeft,
  Edit3,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

const FeatureCard = ({ icon: Icon, title, items }: { icon: any, title: string, items: string[] }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all"
  >
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <h3 className="text-xl font-bold text-zinc-900 mb-4">{title}</h3>
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-zinc-600 text-sm">
          <span className="text-blue-500 font-bold mt-0.5">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const StepItem = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex gap-6 items-start p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
    <span className="text-4xl font-black text-blue-600/20 leading-none">{number}</span>
    <div>
      <h4 className="text-lg font-bold text-zinc-900 mb-1">{title}</h4>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export const ChordBookLanding = ({ onUploadClick }: { onUploadClick: () => void }) => {
  const GITHUB_RELEASES = "https://github.com/lodbig/ChordBook1/releases";

  return (
    <div className="bg-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold mb-8"
          >
            <Zap className="w-4 h-4" />
            חדש: אפליקציית ChordBook זמינה להורדה חינם
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight text-zinc-900 mb-8"
          >
            ChordBook <br />
            <span className="text-blue-600">המוזיקה שלך, בכל מקום.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-600 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            קח את האקורדים שלך לבמה עם האפליקציה המתקדמת לניהול שירים בזמן אמת. 
            סנכרון מלא, גלילה אוטומטית, ושינוי סולמות בלחיצת כפתור - הכל בחינם וללא פרסומות.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a 
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold flex flex-col items-center hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-5 h-5" />
                <span>הורד ל-Windows</span>
              </div>
              <span className="text-[10px] opacity-60 font-normal">גרסת שולחן עבודה מלאה</span>
            </a>
            <a 
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-zinc-900 border-2 border-zinc-200 px-8 py-4 rounded-2xl font-bold flex flex-col items-center hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-5 h-5" />
                <span>הורד ל-Android</span>
              </div>
              <span className="text-[10px] opacity-60 font-normal">אפליקציה לטאבלט ונייד</span>
            </a>
          </motion.div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Community & Writing Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-zinc-900 mb-6 leading-tight">
                הקהילה היא הלב של <br />
                <span className="text-blue-600">ChordShare.</span>
              </h2>
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
                בין אם אתם רק מתחילים לנגן או שאתם מוזיקאים מקצועיים, השיתוף שלכם עוזר לאחרים לגלות מוזיקה חדשה וללמוד לנגן את השירים שהם אוהבים.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Edit3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">למתחילים: פשוט תתחילו</h4>
                    <p className="text-sm text-zinc-500">העלו שירים פשוטים עם אקורדים בסיסיים. כל שיר עוזר למישהו אחר להתחיל את המסע שלו.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">למתקדמים: שתפו את הידע</h4>
                    <p className="text-sm text-zinc-500">העלו עיבודים מורכבים, אקורדים מיוחדים (Slash Chords) וגרסאות מדויקות להופעה.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl">
              <div className="aspect-video bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                <Music className="w-16 h-16 text-zinc-300" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-zinc-900 mb-2">מוכנים לשתף?</h3>
                <p className="text-zinc-500 text-sm mb-6">העלאת שיר לוקחת פחות מדקה. הצטרפו למאות מוזיקאים שכבר משתפים.</p>
                <button 
                  onClick={onUploadClick}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-all"
                >
                  העלה שיר עכשיו
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-900 mb-4">למה ChordBook?</h2>
            <p className="text-zinc-500">כל הכלים שמוזיקאי צריך, באפליקציה אחת עוצמתית.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap}
              title="ביצוע חכם"
              items={["גלילה אוטומטית מותאמת קצב", "קריאה בזמן אמת עם טקסט ברור", "שליטה מלאה במקלדת ומגע"]}
            />
            <FeatureCard 
              icon={Music}
              title="ניהול שירים"
              items={["ספרייה ממוקדת וארגונומית", "חיפוש מהיר לפי תגיות", "עריכה גמישה ונוחה"]}
            />
            <FeatureCard 
              icon={Sliders}
              title="הנדסת סולמות"
              items={["שינוי סולם (Transpose) מיידי", "תמיכה באקורדים מורכבים", "זכרון סולם מועדף לכל שיר"]}
            />
            <FeatureCard 
              icon={Palette}
              title="התאמה אישית"
              items={["מצב לילה להופעות", "הגדרת אקורדים וקיצורים", "התאמת גדלי טקסט"]}
            />
            <FeatureCard 
              icon={ListMusic}
              title="ארגון מתקדם"
              items={["יצירת פלייליסטים וסט-ליסטים", "סיווג לפי ז'אנר וקושי", "ייצוא איכותי ל-PDF"]}
            />
            <FeatureCard 
              icon={Cpu}
              title="טכנולוגיה חזקה"
              items={["עבודה מלאה ללא אינטרנט", "ביצועים מהירים ויציבים", "ממשק תגובתי ומודרני"]}
            />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-8">איך מתחילים?</h2>
              <div className="space-y-4">
                <StepItem number="01" title="הורדה והתקנה" description="הורד את ChordBook למחשב או לנייד והתקן בדקה אחת." />
                <StepItem number="02" title="הוסף את השירים שלך" description="צור שירים חדשים או הדבק טקסט עם אקורדים קיימים." />
                <StepItem number="03" title="סדר שירים בתגיות" description="תייג שירים לפי ז'אנר, רמת קושי או אירוע." />
                <StepItem number="04" title="צור פלייליסטים" description="ארגן רשימות מסודרות להופעות וחזרות." />
                <StepItem number="05" title="הנגן בביטחון" description="התחל ביצוע והישאר ממוקד בנגינה." />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-blue-600 rounded-3xl rotate-3 absolute inset-0 opacity-20" />
              <div className="aspect-square bg-zinc-800 rounded-3xl relative z-10 border border-zinc-700 flex items-center justify-center">
                <Monitor className="w-32 h-32 text-zinc-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-12">נבנה עם הטכנולוגיות המובילות</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Flutter", "Dart", "Riverpod", "Hive", "Go Router", "PDF Generation"].map(tech => (
              <span key={tech} className="px-6 py-2 bg-zinc-100 text-zinc-600 rounded-full font-medium border border-zinc-200">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600 text-white text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-black mb-8">מוכנים לעלות לבמה?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            הצטרפו לאלפי מוזיקאים שכבר משתמשים ב-ChordBook כדי לנהל את המוזיקה שלהם בצורה מקצועית.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-xl"
            >
              הורד חינם עכשיו
            </a>
          </div>
          <p className="mt-8 text-blue-200 text-sm">
            חינם לחלוטין • ללא מודעות • קוד פתוח
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 text-center text-zinc-400 text-sm">
        <div className="container mx-auto px-6">
          <p>© 2026 ChordBook & ChordShare. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};
