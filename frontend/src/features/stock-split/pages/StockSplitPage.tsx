import { useNavigate } from 'react-router-dom';
import { WholesaleStockSplitView } from '../components/WholesaleStockSplitView';

export function StockSplitPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <WholesaleStockSplitView onBack={() => navigate('/dashboard')} />
    </div>
  );
}
