export interface Event {
  id: string;
  title: string;
  desc?: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: number;
  status: 'Todo' | 'In Progress' | 'Completed' | 'Expired';
  start: Date;
  end: Date;
  allDay?: boolean;
}