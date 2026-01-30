
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    nav: {
      home: '首页',
      competitions: '竞赛中心',
      resources: '教研资源',
      dashboard: '个人中心',
      login: '登录 / 注册',
      logout: '退出登录',
      title: '深圳数学学会教师论文竞赛平台',
      userMgmt: '用户管理',
      compMgmt: '竞赛管理',
      resMgmt: '资源管理',
      newsMgmt: '公告管理'
    },
    home: {
      heroTitle: '提升数学艺术，分享教育智慧',
      heroSub: '欢迎来到深圳数学学会教师专业发展与竞赛官方服务平台。在这里，您可以分享教学经验，参与高水平教研竞赛。',
      ctaRegister: '立即参加评选',
      ctaGuide: '撰写与提交指南',
      popular: '竞赛类别',
      viewAll: '查看全部项目',
      process: '评选流程',
      newsTitle: '通知公告',
      newsMore: '更多',
      newsList: [
        { date: '2024-05-20', title: '关于2024年度教育教学研究论文格式要求的补充通知' },
        { date: '2024-05-15', title: '学会新版教师教研成果 LaTeX 模板正式发布' },
        { date: '2024-05-10', title: '“卓越课堂”教学创新案例评选第一阶段结果公示' }
      ],
      partnersTitle: '学术支持与合作院校',
      steps: [
        { title: '教师注册', desc: '创建您的教研档案' },
        { title: '在线报名', desc: '选择评选类别并填写信息' },
        { title: '评审费用', desc: '完成论文评审费用支付' },
        { title: '模板下载', desc: '下载规范的教研论文模板' },
        { title: '论文上传', desc: '提交您的研究成果或案例' }
      ]
    },
    dashboard: {
      welcome: '欢迎您',
      sub: '在个人中心，您可以管理您的参赛论文与教研成果',
      all: '全部项目',
      pending: '待办事项',
      status: {
        pending: '待缴费',
        paid: '待上传论文',
        submitted: '已完成提交'
      },
      steps: {
        reg: '在线报名',
        pay: '评审缴费',
        submit: '论文提交'
      },
      actions: {
        payNow: '立即支付评审费',
        upload: '上传论文/案例 (ZIP/PDF)',
        done: '已完成'
      },
      resources: '教研模版下载',
      notice: '重要提醒'
    },
    login: {
      name: '姓名',
      institution: '任教单位',
      title: '职称 / 职务',
      phone: '手机号码',
      email: '电子邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      verificationCode: '邮箱验证码',
      newPassword: '新密码',
      namePlaceholder: '请输入您的真实姓名',
      instPlaceholder: '如：XX市实验小学',
      titlePlaceholder: '如：高级教师 / 教导主任',
      phonePlaceholder: '请输入11位手机号',
      emailPlaceholder: 'name@school.edu.cn',
      confirmPasswordPlaceholder: '请再次输入密码',
      verificationCodePlaceholder: '请输入6位验证码',
      newPasswordPlaceholder: '请输入新密码(至少6位)',
      sendCode: '发送验证码',
      resendCode: '重新发送',
      codeSent: '验证码已发送',
      passwordMismatch: '两次输入的密码不一致',
      forgotPassword: '忘记密码？',
      resetPassword: '重置密码',
      resetPasswordTitle: '找回密码',
      resetPasswordSub: '通过邮箱验证码重置您的密码',
      btnSubmitReset: '确认重置',
      backToLogin: '返回登录',
      resetSuccess: '密码重置成功！请使用新密码登录',
      welcomeBack: '欢迎回来',
      signUp: '注册账户',
      loginSub: '登录以管理您的论文项目',
      signUpSub: '加入教师专业交流平台',
      btnSubmitLogin: '立即登录',
      btnSubmitSignUp: '立即注册',
      hasAccount: '已有账户？',
      noAccount: '还没有账户？',
      switchSignUp: '现在注册',
      switchLogin: '返回登录'
    },
    ai: {
      name: 'XXXX教研助手',
      welcome: '老师您好！我是您的教研助手。关于论文格式、提交要求或评选规则，您可以随时问我。',
      placeholder: '请输入您的问题...',
      thinking: '正在思考...'
    }
  },
  en: {
    nav: {
      home: 'Home',
      competitions: 'Paper Submissions',
      resources: 'Teaching Resources',
      dashboard: 'Dashboard',
      login: 'Login / Register',
      logout: 'Logout',
      title: 'shenzhen mathematics Teacher Portal',
      userMgmt: 'User Management',
      compMgmt: 'Competition Management',
      resMgmt: 'Resource Management',
      newsMgmt: 'News Management'
    },
    home: {
      heroTitle: 'Enhance Mathematics Art, Share Wisdom',
      heroSub: 'Official portal for teacher professional development and paper evaluation. Share experiences and participate in high-level research.',
      ctaRegister: 'Participate Now',
      ctaGuide: 'Writing Guide',
      popular: 'Competition Categories',
      viewAll: 'View All',
      process: 'Selection Process',
      newsTitle: 'Announcements',
      newsMore: 'More',
      steps: [
        { title: 'Registration', desc: 'Create teacher profile' },
        { title: 'Application', desc: 'Choose category and apply' },
        { title: 'Payment', desc: 'Pay review fees' },
        { title: 'Downloads', desc: 'Get standard templates' },
        { title: 'Submission', desc: 'Upload your research' }
      ]
    },
    dashboard: {
      welcome: 'Welcome',
      sub: 'Manage your papers and research achievements here.',
      all: 'All',
      pending: 'Pending',
      status: {
        pending: 'Pending Payment',
        paid: 'Awaiting Paper',
        submitted: 'Completed'
      },
      steps: {
        reg: 'Application',
        pay: 'Payment',
        submit: 'Submission'
      },
      actions: {
        payNow: 'Pay Review Fee',
        upload: 'Upload Paper/Case (ZIP/PDF)',
        done: 'Finished'
      },
      resources: 'Resource Center',
      notice: 'Notices'
    },
    login: {
      name: 'Full Name',
      institution: 'Institution / School',
      title: 'Title / Position',
      phone: 'Phone Number',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      verificationCode: 'Verification Code',
      newPassword: 'New Password',
      namePlaceholder: 'Your full name',
      instPlaceholder: 'e.g., XXX High School',
      titlePlaceholder: 'e.g., Senior Teacher / Dean',
      phonePlaceholder: 'Enter your phone number',
      emailPlaceholder: 'name@school.edu.cn',
      confirmPasswordPlaceholder: 'Enter password again',
      verificationCodePlaceholder: 'Enter 6-digit code',
      newPasswordPlaceholder: 'Enter new password (at least 6 chars)',
      sendCode: 'Send Code',
      resendCode: 'Resend',
      codeSent: 'Code Sent',
      passwordMismatch: 'Passwords do not match',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      resetPasswordTitle: 'Reset Password',
      resetPasswordSub: 'Reset your password via email verification',
      btnSubmitReset: 'Confirm Reset',
      backToLogin: 'Back to Login',
      resetSuccess: 'Password reset successful! Please login with new password',
      welcomeBack: 'Welcome Back',
      signUp: 'Sign Up',
      loginSub: 'Login to manage papers',
      signUpSub: 'Join teacher community',
      btnSubmitLogin: 'Login',
      btnSubmitSignUp: 'Register',
      hasAccount: 'Have account?',
      noAccount: 'No account?',
      switchSignUp: 'Sign up',
      switchLogin: 'Back to login'
    },
    ai: {
      name: 'XXXX Research Assistant',
      welcome: 'Hello teacher! I am your research assistant. Feel free to ask about paper formats or rules.',
      placeholder: 'Type your question...',
      thinking: 'Thinking...'
    }
  }
};
