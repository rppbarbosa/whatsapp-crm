declare module 'react-big-calendar' {
  import { Component } from 'react';

  export interface CalendarProps<TEvent = any, TResource = any> {
    localizer: any;
    events: TEvent[];
    startAccessor: string;
    endAccessor: string;
    style?: React.CSSProperties;
    view?: string;
    onView?: (view: string) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
    onSelectEvent?: (event: TEvent) => void;
    eventPropGetter?: (event: TEvent) => { style?: React.CSSProperties };
    selectable?: boolean;
    messages?: {
      next?: string;
      previous?: string;
      today?: string;
      month?: string;
      week?: string;
      day?: string;
      agenda?: string;
      date?: string;
      time?: string;
      event?: string;
      noEventsInRange?: string;
      showMore?: (total: number) => string;
    };
  }

  export class Calendar<TEvent = any, TResource = any> extends Component<CalendarProps<TEvent, TResource>> {}

  export function momentLocalizer(moment: any): any;
}
