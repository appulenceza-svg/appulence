const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

if (!code.includes('import SupportChatsDashboard')) {
  code = code.replace(
    "import AILogsDashboard from './AILogsDashboard';",
    "import AILogsDashboard from './AILogsDashboard';\nimport SupportChatsDashboard from './SupportChatsDashboard';"
  );
  
  code = code.replace(
    "import { PhoneCall } from 'lucide-react';",
    "import { PhoneCall, MessageSquare } from 'lucide-react';"
  );

  code = code.replace(
    "{ id: '/dashboard/ai-leads', label: 'AI Voice Leads', icon: PhoneCall, show: isAdmin },",
    "{ id: '/dashboard/ai-leads', label: 'AI Voice Leads', icon: PhoneCall, show: isAdmin },\n    { id: '/dashboard/support-chats', label: 'Support Chats', icon: MessageSquare, show: isAdmin },"
  );

  code = code.replace(
    ") : currentPath === '/dashboard/ai-leads' ? (",
    ") : currentPath === '/dashboard/support-chats' ? (\n              <SupportChatsDashboard />\n            ) : currentPath === '/dashboard/ai-leads' ? ("
  );
  
  fs.writeFileSync('src/components/DashboardLayout.tsx', code);
}
