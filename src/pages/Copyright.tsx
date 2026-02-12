import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Phone } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Copyright = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient mb-6">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {language === 'ar' ? 'حقوق الطبع والنشر' : language === 'fr' ? 'Droits d\'Auteur' : 'Copyright'}
            </h1>
            <p className="text-primary font-semibold">© 2026 مكتبة موريتانيا</p>
          </div>

          <div className="card-cozy p-6 space-y-6 text-foreground leading-relaxed" dir="rtl">
            <div>
              <h2 className="text-lg font-bold mb-3">الإشعار المتعلق بانتهاك حقوق النشر:</h2>
              <p className="text-muted-foreground">
                وفقًا لقانون حقوق النشر الرقمية للألفية (17 U.S.C من القسم 512)، قام تطبيق مكتبة موريتانيا بتنفيذ إجراءات لتلقي إشعار كتابي بالانتهاكات المزعومة. كما خصص وكيلاً لتلقي الإشعارات المتعلقة بانتهاكات حقوق النشر المزعومة. إذا اعتقدت بنية حسنة أن حقوق النشر الخاصة بك تم انتهاكها، يرجى إرسال رسالة تتضمن:
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
                <li>عنوان الكتاب المحمي بحقوق النشر الذي تزعم أنه منتهك.</li>
                <li>تصريحًا من جانبك، تحت طائلة عقوبة الحنث باليمين، بأن المعلومات الواردة في إشعارك دقيقة وأنك مالك حقوق النشر أو مخول بالتصرف بالنيابة عن مالك حقوق النشر.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-semibold">يرجى الاتصال بنا عن طريق:</p>
              <a href="mailto:salemmoustapha15@gmail.com" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                📧 البريد الإلكتروني: salemmoustapha15@gmail.com
              </a>
              <a href="https://wa.me/22226749039" className="flex items-center gap-2 text-primary hover:underline">
                <Phone className="h-4 w-4" />
                📞 الهاتف: +222 26749039
              </a>
            </div>

            <p className="text-muted-foreground">
              جميع حقوق المؤلفات المتوفرة على تطبيقنا تابعة لمؤلفيها من حيث الطباعة والنشر والخصوصية، فتطبيقنا لا ينتهك أي حقوق طبع أو تأليف أو نشر أو مخالفة لمؤلفي الكتب، وجميع الكتب المتوفرة في مكتبة موريتانيا هي للتحميل المجاني.
            </p>

            <p className="text-muted-foreground">
              إن مكتبة موريتانيا منصة للنشر الإلكتروني مفتوحة أمام الكتاب والقراء لرفع المواد وتعديلها وفق سياسة المشاع الإبداعي العالمية. يتم رفع الملفات ومشاركتها عبر شبكة الإنترنت تحت هذا البند، مع العلم بأن فريق عمل المكتبة لم يقم بتصوير أي كتاب أو مسحه ضوئيًا، بل قمنا فقط بمجهود التجميع والفهرسة والترتيب في تطبيق واحد.
            </p>

            <p className="text-muted-foreground">
              إذا كنت تعتقد أن نشر أي من هذه الملفات الإلكترونية ينتهك قوانين النشر والتوزيع لكتبك أو مؤسسة النشر التي تعمل بها أو من تنوب عنهم قانونياً، أو أي انتهاك من أي نوع، يرجى التبليغ عبر التواصل معنا على:
            </p>

            <a href="mailto:salemmoustapha15@gmail.com" className="flex items-center gap-2 text-primary hover:underline">
              <Mail className="h-4 w-4" />
              📧 البريد الإلكتروني: salemmoustapha15@gmail.com
            </a>

            <p className="text-muted-foreground">
              تطبيق مكتبة موريتانيا محاولة بسيطة لتشجيع المجتمع العربي على القراءة، إذ تم تجميع الكتب من عدة مصادر موجودة مسبقًا على الإنترنت ومتاحة للتحميل من عدة مصادر، ومنها المرسلة إلينا من طرف أصحابها مساهمةً منهم في نشر المعرفة وإثراء محتوى التطبيق والمحتوى العربي.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center p-6 text-muted-foreground mt-6">
            <p className="font-medium">© 2026 مكتبة موريتانيا</p>
            <p className="text-sm mt-2">salem4library.lovable.app</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Copyright;
