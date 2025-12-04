import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

export class GraphService {
    getClient(accessToken: string): Client {
        return Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            }
        });
    }

    // --- Mail ---
    async listEmails(accessToken: string, filter?: string): Promise<any[]> {
        const client = this.getClient(accessToken);
        let request = client.api('/me/messages').top(10).select('subject,from,receivedDateTime,bodyPreview,id');
        if (filter) {
            request = request.filter(filter);
        }
        const response = await request.get();
        return response.value;
    }

    async getAttachment(accessToken: string, messageId: string, attachmentId: string): Promise<any> {
        const client = this.getClient(accessToken);
        return await client.api(`/me/messages/${messageId}/attachments/${attachmentId}`).get();
    }

    async sendEmail(accessToken: string, to: string, subject: string, body: string): Promise<void> {
        const client = this.getClient(accessToken);
        const mail = {
            subject: subject,
            toRecipients: [{
                emailAddress: { address: to }
            }],
            body: {
                content: body,
                contentType: "html"
            }
        };
        await client.api('/me/sendMail').post({ message: mail });
    }

    // --- Calendar ---
    async listEvents(accessToken: string, start: string, end: string): Promise<any[]> {
        const client = this.getClient(accessToken);
        return await client.api('/me/calendarView')
            .query({ startDateTime: start, endDateTime: end })
            .select('subject,start,end,location')
            .get()
            .then((res) => res.value);
    }

    async createEvent(accessToken: string, subject: string, start: string, end: string): Promise<void> {
        const client = this.getClient(accessToken);
        const event = {
            subject: subject,
            start: { dateTime: start, timeZone: "UTC" },
            end: { dateTime: end, timeZone: "UTC" }
        };
        await client.api('/me/events').post(event);
    }

    async findMeetingTimes(accessToken: string, attendees: string[], duration: string = "PT30M"): Promise<any> {
        const client = this.getClient(accessToken);
        const body = {
            attendees: attendees.map(email => ({ type: "required", emailAddress: { address: email } })),
            timeConstraint: {
                activityDomain: "work",
                timeSlots: [{
                    start: { dateTime: new Date().toISOString(), timeZone: "UTC" },
                    end: { dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), timeZone: "UTC" }
                }]
            },
            meetingDuration: duration
        };
        return await client.api('/me/findMeetingTimes').post(body);
    }

    // --- Drive ---
    async uploadFile(accessToken: string, fileName: string, content: any): Promise<any> {
        const client = this.getClient(accessToken);
        return await client.api(`/me/drive/root:/${fileName}:/content`).put(content);
    }

    async downloadFile(accessToken: string, itemId: string): Promise<any> {
        const client = this.getClient(accessToken);
        return await client.api(`/me/drive/items/${itemId}/content`).get();
    }

    async listDriveItems(accessToken: string, folderId: string = 'root'): Promise<any[]> {
        const client = this.getClient(accessToken);
        const response = await client.api(`/me/drive/items/${folderId}/children`).get();
        return response.value;
    }

    // --- Contacts ---
    async createContact(accessToken: string, contact: any): Promise<any> {
        const client = this.getClient(accessToken);
        return await client.api('/me/contacts').post(contact);
    }

    async listContacts(accessToken: string, filter?: string): Promise<any[]> {
        const client = this.getClient(accessToken);
        let request = client.api('/me/contacts').top(20);
        if (filter) {
            request = request.filter(filter);
        }
        const response = await request.get();
        return response.value;
    }

    // --- Tasks (ToDo) ---
    async createTask(accessToken: string, listId: string, title: string): Promise<any> {
        const client = this.getClient(accessToken);
        return await client.api(`/me/todo/lists/${listId}/tasks`).post({ title });
    }

    async listTaskLists(accessToken: string): Promise<any[]> {
        const client = this.getClient(accessToken);
        const response = await client.api('/me/todo/lists').get();
        return response.value;
    }

    async listTasks(accessToken: string, listId: string): Promise<any[]> {
        const client = this.getClient(accessToken);
        const response = await client.api(`/me/todo/lists/${listId}/tasks`).get();
        return response.value;
    }
}

export const graphService = new GraphService();
