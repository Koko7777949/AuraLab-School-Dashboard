// ============================================================
// AuraLab - Internationalization (i18n)
// ============================================================

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const ar: Translations = {
  // ─── Admin Profile ───
  'adminProfile.title': 'الملف الشخصي',
  'adminProfile.badge': 'معلومات الحساب',
  'adminProfile.name': 'الاسم الكامل',
  'adminProfile.email': 'البريد الإلكتروني',
  'adminProfile.phone': 'رقم الهاتف',
  'adminProfile.role': 'المسمى الوظيفي',
  'adminProfile.avatar': 'الصورة الشخصية',
  'adminProfile.avatarChange': 'تغيير الصورة',
  'adminProfile.save': 'حفظ الملف الشخصي',
  'adminProfile.saved': 'تم حفظ الملف الشخصي بنجاح',
  'adminProfile.passwordTitle': 'تغيير كلمة المرور',
  'adminProfile.currentPassword': 'كلمة المرور الحالية',
  'adminProfile.newPassword': 'كلمة المرور الجديدة',
  'adminProfile.confirmPassword': 'تأكيد كلمة المرور',
  'adminProfile.passwordMismatch': 'كلمتا المرور غير متطابقتين',
  'adminProfile.passwordChanged': 'تم تغيير كلمة المرور بنجاح',
  'adminProfile.passwordChange': 'تغيير كلمة المرور',
  'adminProfile.namePlaceholder': 'أدخل الاسم الكامل',
  'adminProfile.emailPlaceholder': 'أدخل البريد الإلكتروني',
  'adminProfile.phonePlaceholder': 'أدخل رقم الهاتف',
  'adminProfile.rolePlaceholder': 'أدخل المسمى الوظيفي',

  // ─── AI Assistant ───
  'ai.title': 'المساعد الذكي',
  'ai.online': 'متصل',
  'ai.clearChat': 'مسح المحادثة',
  'ai.placeholder': 'اكتب رسالتك هنا...',
  'ai.send': 'إرسال',
  'ai.typing': 'يكتب...',
  'ai.error': 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
  'ai.ttsTooltip': 'قراءة الصوت',
  'ai.ttsLoading': 'جاري التوليد...',
  'ai.micTooltip': 'إدخال صوتي',
  'ai.micRecording': 'جاري التسجيل... انقر للإيقاف',
  'ai.micProcessing': 'جاري المعالجة...',
  'ai.attachTooltip': 'إرفاق ملف',
  'ai.attachAccepted': 'صور أو PDF',
  'ai.filePreview': 'معاينة الملف',
  'ai.analyzing': 'جاري التحليل...',
  'ai.welcome': 'مرحباً! أنا المساعد الذكي لنظام AuraLab. يمكنني مساعدتك في تحليل بيانات الطلاب، تقديم اقتراحات لتحسين التفاعل، وإعداد التقارير. كيف يمكنني مساعدتك اليوم؟',

  // ─── Settings ───
  'settings.title': 'إعدادات النظام',
  'settings.subtitle': 'تخصيص إعدادات النظام والملف الشخصي والإشعارات',
  'settings.reset': 'إعادة تعيين',
  'settings.save': 'حفظ التغييرات',
  'settings.saved': 'تم الحفظ',
  'settings.savedSuccess': 'تم حفظ التغييرات بنجاح',
  'settings.review': 'تأكد من مراجعة التغييرات قبل الحفظ',

  // ─── General ───
  'general.cancel': 'إلغاء',
  'general.delete': 'حذف',
  'general.edit': 'تعديل',
  'general.save': 'حفظ',
  'general.close': 'إغلاق',
  'general.loading': 'جاري التحميل...',
  'general.readOnly': 'للقراءة فقط',
};

const en: Translations = {
  // ─── Admin Profile ───
  'adminProfile.title': 'Admin Profile',
  'adminProfile.badge': 'Account Info',
  'adminProfile.name': 'Full Name',
  'adminProfile.email': 'Email',
  'adminProfile.phone': 'Phone Number',
  'adminProfile.role': 'Role / Position',
  'adminProfile.avatar': 'Profile Photo',
  'adminProfile.avatarChange': 'Change Photo',
  'adminProfile.save': 'Save Profile',
  'adminProfile.saved': 'Profile saved successfully',
  'adminProfile.passwordTitle': 'Change Password',
  'adminProfile.currentPassword': 'Current Password',
  'adminProfile.newPassword': 'New Password',
  'adminProfile.confirmPassword': 'Confirm Password',
  'adminProfile.passwordMismatch': 'Passwords do not match',
  'adminProfile.passwordChanged': 'Password changed successfully',
  'adminProfile.passwordChange': 'Change Password',
  'adminProfile.namePlaceholder': 'Enter full name',
  'adminProfile.emailPlaceholder': 'Enter email address',
  'adminProfile.phonePlaceholder': 'Enter phone number',
  'adminProfile.rolePlaceholder': 'Enter role/position',

  // ─── AI Assistant ───
  'ai.title': 'AI Assistant',
  'ai.online': 'Online',
  'ai.clearChat': 'Clear Chat',
  'ai.placeholder': 'Type your message here...',
  'ai.send': 'Send',
  'ai.typing': 'Typing...',
  'ai.error': 'Sorry, an error occurred. Please try again.',
  'ai.ttsTooltip': 'Read Aloud',
  'ai.ttsLoading': 'Generating...',
  'ai.micTooltip': 'Voice Input',
  'ai.micRecording': 'Recording... Click to stop',
  'ai.micProcessing': 'Processing...',
  'ai.attachTooltip': 'Attach File',
  'ai.attachAccepted': 'Images or PDF',
  'ai.filePreview': 'File Preview',
  'ai.analyzing': 'Analyzing...',
  'ai.welcome': 'Hello! I am the AI assistant for AuraLab. I can help you analyze student data, suggest improvements, and prepare reports. How can I help you today?',

  // ─── Settings ───
  'settings.title': 'System Settings',
  'settings.subtitle': 'Customize system, profile, and notification settings',
  'settings.reset': 'Reset',
  'settings.save': 'Save Changes',
  'settings.saved': 'Saved',
  'settings.savedSuccess': 'Changes saved successfully',
  'settings.review': 'Review changes before saving',

  // ─── General ───
  'general.cancel': 'Cancel',
  'general.delete': 'Delete',
  'general.edit': 'Edit',
  'general.save': 'Save',
  'general.close': 'Close',
  'general.loading': 'Loading...',
  'general.readOnly': 'Read Only',
};

const translations: Record<'ar' | 'en', Translations> = { ar, en };

/**
 * Get a translated string by key.
 * Defaults to Arabic if the language is not found.
 */
export function t(key: TranslationKey, lang: 'ar' | 'en' = 'ar'): string {
  return translations[lang]?.[key] ?? translations.ar[key] ?? key;
}

export type { TranslationKey, Translations };
