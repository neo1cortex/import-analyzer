import { PanelRightOpen } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function Popup() {
  const openPanel = async () => {
    const window = await chrome.windows.getCurrent();
    if (window.id !== undefined) await chrome.sidePanel.open({ windowId: window.id });
  };

  return <main className="w-80 p-4"><h1 className="text-lg font-semibold">Import Analyzer</h1><p className="mt-2 text-sm text-slate-600">Abre un anuncio de Mobile.de y analiza sus datos localmente.</p><button className="mt-4 inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={openPanel}><PanelRightOpen size={16} />Abrir panel</button></main>;
}

createRoot(document.getElementById('root')!).render(<Popup />);
