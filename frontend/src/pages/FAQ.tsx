import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  {
    question: 'When is rent due?',
    answer: 'Rent is due on the 1st of each month. Late payments may incur a fee.'
  },
  {
    question: 'How can I make a rent payment?',
    answer: 'You can make payments through the Financial Account page using your preferred payment method.'
  },
  {
    question: 'What should I do if I have trouble making a payment?',
    answer: 'If you are experiencing issues with payments, please contact support as soon as possible to discuss your options.'
  },
  {
    question: 'How do I update my payment information?',
    answer: 'Go to your profile page and update your payment details under Account Settings.'
  },
  {
    question: 'How do I view my payment history?',
    answer: 'Your full payment history is available on the Financial Account page.'
  },
  {
    question: 'Who do I contact for support?',
    answer: 'You can contact support using the button below or from any page where support is mentioned.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Go to the login page and click on "Forgot Password?" to receive a reset link.'
  },
  {
    question: 'How do I update my personal information?',
    answer: 'Visit your profile page to update your name, email, or other personal details.'
  },
];

const FAQ = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-roomzi-blue flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-400" /> FAQ
            </h1>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {faqs.map((faq, i) => (
          <Card key={i} className="p-6">
            <div className="font-semibold text-gray-800 mb-2">{faq.question}</div>
            <div className="text-gray-700">{faq.answer}</div>
          </Card>
        ))}
        <div className="flex justify-center mt-8">
          <Button className="roomzi-gradient" size="lg" onClick={() => alert('Contact support coming soon!')}>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 