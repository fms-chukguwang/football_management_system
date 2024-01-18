export interface EmailRequest {
    email: string;
    subject: string;
    clubName: string;
    originalSchedule: string;
    newSchedule: string;
    reason: string;
    senderName: string;
    url: string;
    chk: string;
    homeTeamId:number;
    awayTeamId:number;
    fieldId:number;
    token:string;
  }