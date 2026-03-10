import { format, isToday, isYesterday, parseISO } from 'date-fns';

export const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
};

export const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
};

export const getHoursBetween = (start: string, end: string): number => {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return diffTime / (1000 * 60 * 60);
};

export const getMinutesBetween = (start: string, end: string): number => {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return diffTime / (1000 * 60);
};
