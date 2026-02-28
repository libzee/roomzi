import { AlertCircle, Calendar } from 'lucide-react';

const UpcomingPaymentBanner = ({ amount, dueDate }: { amount: number; dueDate: string }) => (
  <div className="flex items-center gap-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow mb-6">
    <AlertCircle className="w-6 h-6 text-yellow-500" />
    <div className="flex-1">
      <div className="font-semibold text-yellow-800 text-sm mb-1">Upcoming Rent Due</div>
      <div className="text-yellow-900 text-lg font-bold">
        ${amount.toLocaleString()} <span className="text-sm font-normal text-yellow-700">due {dueDate}</span>
      </div>
    </div>
    <Calendar className="w-5 h-5 text-yellow-400 ml-2" />
  </div>
);

export default UpcomingPaymentBanner; 