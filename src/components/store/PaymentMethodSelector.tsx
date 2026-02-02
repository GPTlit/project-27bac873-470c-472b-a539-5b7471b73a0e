import { cn } from '@/lib/utils';
import bankilyLogo from '@/assets/bankily-logo.jpg';
import sedadLogo from '@/assets/sedad-logo.jpg';
import masriviLogo from '@/assets/masrivi-logo.jpg';
import bimbankLogo from '@/assets/bimbank-logo.jpg';

export type PaymentMethod = 'bankily' | 'sedad' | 'masrivi' | 'bimbank';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  nameAr: string;
  logo: string;
}

const paymentMethods: PaymentMethodOption[] = [
  { id: 'bankily', name: 'Bankily', nameAr: 'بنكيلي', logo: bankilyLogo },
  { id: 'sedad', name: 'Sedad', nameAr: 'السداد', logo: sedadLogo },
  { id: 'masrivi', name: 'Masrivi', nameAr: 'مصرفي', logo: masriviLogo },
  { id: 'bimbank', name: 'Bimbank', nameAr: 'بيم بنك', logo: bimbankLogo },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">اختر طريقة الدفع</p>
      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
              selected === method.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <img
              src={method.logo}
              alt={method.name}
              className="w-12 h-12 object-contain rounded"
            />
            <span className="text-xs font-medium">{method.nameAr}</span>
          </button>
        ))}
      </div>
      <div className="p-3 bg-muted rounded-lg text-center">
        <p className="text-sm font-medium">رقم الدفع:</p>
        <p className="text-lg font-bold text-primary direction-ltr">26749039</p>
      </div>
    </div>
  );
};
