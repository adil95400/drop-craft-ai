import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useDashboardConfig, TimeRange, getTimeRangeLabel } from '@/hooks/useDashboardConfig';
import { cn } from '@/lib/utils';

export function TimeRangeSelector() {
  const { timeRange, customDateRange, setTimeRange, setCustomDateRange } = useDashboardConfig();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: customDateRange ? new Date(customDateRange.start) : undefined,
    to: customDateRange ? new Date(customDateRange.end) : undefined,
  });

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: '7 derniers jours' },
    { value: 'month', label: '30 derniers jours' },
    { value: 'quarter', label: '3 derniers mois' },
    { value: 'year', label: '12 derniers mois' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setDateRange(range);
      if (range.from && range.to) {
        setCustomDateRange({
          start: range.from.toISOString(),
          end: range.to.toISOString(),
        });
        setTimeRange('custom');
        setIsCalendarOpen(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={timeRange} onValueChange={handleTimeRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          {timeRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {timeRange === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM', { locale: getDateFnsLocale() })} -{' '}
                    {format(dateRange.to, 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                  </>
                ) : (
                  format(dateRange.from, 'dd MMM yyyy', { locale: getDateFnsLocale() })
                )
              ) : (
                <span>Choisir les dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange as any}
              onSelect={handleDateSelect as any}
              numberOfMonths={2}
              locale={getDateFnsLocale()}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
