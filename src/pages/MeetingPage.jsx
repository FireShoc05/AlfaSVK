import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { WizardContainer } from '../components/wizard/WizardContainer';
import { RejectionForm } from '../components/wizard/RejectionForm';

export function MeetingPage() {
  const [meetingType, setMeetingType] = useState(null);

  const handleBack = () => setMeetingType(null);

  if (meetingType === 'success') {
    return <WizardContainer onBack={handleBack} />;
  }

  if (meetingType === 'fail') {
    return <RejectionForm onBack={handleBack} />;
  }

  return (
    <div className="meeting-choice">
      <div className="page-header">
        <h1 className="page-header__title">Новая встреча</h1>
        <p className="page-header__subtitle">Выберите результат встречи</p>
      </div>

      <div className="meeting-choice__grid">
        <button
          className="meeting-choice__card meeting-choice__card--success"
          onClick={() => setMeetingType('success')}
        >
          <div className="meeting-choice__icon">
            <CheckCircle size={48} />
          </div>
          <h2 className="meeting-choice__title">Успешная встреча</h2>
          <p className="meeting-choice__desc">Оформление продаж и услуг</p>
        </button>

        <button
          className="meeting-choice__card meeting-choice__card--fail"
          onClick={() => setMeetingType('fail')}
        >
          <div className="meeting-choice__icon">
            <XCircle size={48} />
          </div>
          <h2 className="meeting-choice__title">Неуспешная встреча</h2>
          <p className="meeting-choice__desc">НДЗ, перенос или отказ</p>
        </button>
      </div>
    </div>
  );
}
