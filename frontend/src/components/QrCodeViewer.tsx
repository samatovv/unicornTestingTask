import { Button } from '@mui/material';
import { useEffect, useState } from 'react';

type Props = {
  companyId: string;
};

export default function QrCodeViewer({ companyId }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'done'>('idle');
  const [ready, setReady] = useState(false);

  const fetchQr = async () => {
    console.log('qr',qr);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/${companyId}/qr`, { cache: 'no-store' });
      console.log('📡 Ответ от сервера:', res);
  
      if (res.status === 202) {
        const data = await res.json();
        console.log('Загрузка QR-кода...', data.message);
        setError('Загрузка QR-кода...');
        
        setTimeout(fetchQr, 9000);
        return;
      }
  
      if (!res.ok) {
        console.log('❗️ Ответ не ok, статус:', res.status);
        throw new Error('QR-код не готов');
      }
  
      const data = await res.json();
      console.log('📦 Полученные данные:', data);
  
      if (typeof data.qr === 'string' && data.qr.startsWith('data:image/png;base64,')) {
        setQr(data.qr);
        setError(null);
      } else {
        console.log('⚠️ Неверный формат QR-кода:', data.qr);
        throw new Error('Неверный формат QR-кода');
      }
    } catch (err) {
      console.error('🚨 Ошибка в fetchQr:', err);
      setError('Ошибка при получении QR-кода');
    } finally {
      setLoading(false);
      console.log('✅ fetchQr завершён');
    }
  };
  
  

  const handleResetSession = async () => {
    console.log('🔄 handleResetSession вызван');
    try {
      const res = await fetch(`http://localhost:8080/api/${companyId}/session`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка при сбросе сессии');
      await res.json();
  
      setQr(null);
      setError(null);
      setResetStatus('done');

    } catch (err) {
      console.error('❌ Ошибка при сбросе:', err);
      alert('Не удалось сбросить сессию');
    }
  };

  async function getStatus() {
    try {
      const res = await fetch(`http://localhost:8080/api/${companyId}/status`, {
        cache: 'no-store',
      });
  
      console.log('📡 Ответ от сервера:', res);
  
      const data = await res.json();
      setReady(data.ready);

    } catch (err) {
      console.error('❌ Ошибка при получении статуса:', err);
    }
  }

  useEffect(() => {
    getStatus();
  },[])
  

  return (
    <div>
      {!qr && (
        <Button
          variant="contained"
          onClick={fetchQr}
          disabled={loading}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? 'Загрузка...' : 'Получить QR-код'}
        </Button>
      )}

      <>
        {qr && (
          <>
            <h2>Сканируй QR-код для входа в WhatsApp:</h2>
            <img
              src={qr || ''}
              alt="QR Code"
              style={{ width: 300 }}
              onError={() => {
                setQr(null);
                setError('Ошибка отображения QR-кода');
              }}
            />
          </>
        )}
        <Button
          variant="contained"
          sx={{ px: 5, ml: 2, color: 'white', mt: 2 }}
          onClick={handleResetSession}
        >
          {resetStatus === 'done' ? 'Сброшено' : 'Сбросить сессию'}
        </Button>
      </>
      {ready && <h2>Клиент готов к работе</h2>}
      {error && <div style={{ color: 'red' }}> {error}</div>}
    </div>
  );
}
