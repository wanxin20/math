
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    nav: {
      home: '首页',
      competitions: '竞赛报名',
      resources: '资源下载',
      dashboard: '个人中心',
      login: '登录 / 注册',
      logout: '退出登录',
      title: 'XXXX竞赛门户'
    },
    home: {
      heroTitle: '发现数学之美，挑战思维极限',
      heroSub: '欢迎来到中国XXXX竞赛官方服务平台。在这里，您可以参与顶级学术竞赛，结识全球优秀的数学校友。',
      ctaRegister: '立即报名竞赛',
      ctaGuide: '获取参赛指南',
      popular: '热门推荐',
      viewAll: '查看全部赛事',
      process: '参赛流程',
      newsTitle: '新闻公告',
      newsMore: '更多新闻',
      newsList: [
        { date: '2024-05-20', title: '关于2024年数学建模竞赛题目范围的说明' },
        { date: '2024-05-15', title: '学会新版 LaTeX 论文模板正式发布下载' },
        { date: '2024-05-10', title: '第34届奥林匹克数学竞赛省赛名单公示' }
      ],
      partnersTitle: '合作伙伴与学术支持',
      steps: [
        { title: '用户注册', desc: '创建您的学术档案' },
        { title: '竞赛报名', desc: '选择并填写报名信息' },
        { title: '在线缴费', desc: '完成参赛费用支付' },
        { title: '模板下载', desc: '准备符合规范的论文' },
        { title: '论文提交', desc: '上传您的研究成果' }
      ]
    },
    dashboard: {
      welcome: '欢迎回来',
      sub: '在个人中心，您可以管理所有已报名的竞赛项目',
      all: '全部竞赛',
      pending: '待完成',
      status: {
        pending: '待缴费',
        paid: '待提交论文',
        submitted: '已完成提交'
      },
      steps: {
        reg: '注册报名',
        pay: '在线缴费',
        submit: '论文提交'
      },
      actions: {
        payNow: '立即模拟支付',
        upload: '上传论文 (ZIP/PDF)',
        done: '已完成'
      },
      resources: '资源模板下载',
      notice: '重要通知'
    },
    ai: {
      name: 'XXXX智能小助手',
      welcome: '您好！我是XXXX小助手。有什么可以帮您的？',
      placeholder: '请输入您的问题...',
      thinking: '思考中...'
    }
  },
  en: {
    nav: {
      home: 'Home',
      competitions: 'Competitions',
      resources: 'Resources',
      dashboard: 'Dashboard',
      login: 'Login / Register',
      logout: 'Logout',
      title: 'XXXX Portal'
    },
    home: {
      heroTitle: 'Discover Beauty of Math, Challenge Your Limits',
      heroSub: 'Welcome to the official portal of XXXX. Participate in top-tier academic competitions and connect with excellent peers worldwide.',
      ctaRegister: 'Register Now',
      ctaGuide: 'Contest Guide',
      popular: 'Popular Recommendations',
      viewAll: 'View All',
      process: 'Competition Process',
      newsTitle: 'News & Announcements',
      newsMore: 'More',
      newsList: [
        { date: '2024-05-20', title: 'Scope of 2024 Math Modeling Competition' },
        { date: '2024-05-15', title: 'New LaTeX Template Released for Download' },
        { date: '2024-05-10', title: 'Olympic Math Regional Qualifiers Final List' }
      ],
      partnersTitle: 'Partners & Academic Support',
      steps: [
        { title: 'Registration', desc: 'Create your profile' },
        { title: 'Sign-up', desc: 'Choose and sign up' },
        { title: 'Payment', desc: 'Pay entry fees' },
        { title: 'Downloads', desc: 'Get standard templates' },
        { title: 'Submission', desc: 'Upload your work' }
      ]
    },
    dashboard: {
      welcome: 'Welcome Back',
      sub: 'Manage all your registered competition projects here.',
      all: 'All',
      pending: 'Pending',
      status: {
        pending: 'Pending Payment',
        paid: 'Awaiting Paper',
        submitted: 'Submission Completed'
      },
      steps: {
        reg: 'Registration',
        pay: 'Payment',
        submit: 'Submission'
      },
      actions: {
        payNow: 'Pay Now (Simulation)',
        upload: 'Upload Paper (ZIP/PDF)',
        done: 'Completed'
      },
      resources: 'Resource Templates',
      notice: 'Important Notice'
    },
    ai: {
      name: 'XXXX AI Assistant',
      welcome: 'Hello! I am your XXXX assistant. How can I help you today?',
      placeholder: 'Type your question...',
      thinking: 'Thinking...'
    }
  }
};
