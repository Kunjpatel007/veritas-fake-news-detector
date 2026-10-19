import ApperIcon from '@/components/ApperIcon';
import { APP_CONFIG } from '@/config/app.config';

export default function AuthLayout({ children, title, description, icon }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-muted/30 py-12 px-4">
      <div className="w-full max-w-[26rem]">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ApperIcon name={icon ?? APP_CONFIG.icon} size={22} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
