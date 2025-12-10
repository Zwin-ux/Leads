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

    async createEvent(
        accessToken: string,
        subject: string,
        start: string,
        end: string,
        options?: {
            attendees?: string[];
            location?: string;
            body?: string;
            isOnlineMeeting?: boolean;
        }
    ): Promise<any> {
        const client = this.getClient(accessToken);
        const event: any = {
            subject: subject,
            start: { dateTime: start, timeZone: "UTC" },
            end: { dateTime: end, timeZone: "UTC" },
            isOnlineMeeting: options?.isOnlineMeeting ?? false,
            onlineMeetingProvider: options?.isOnlineMeeting ? "teamsForBusiness" : undefined
        };

        if (options?.attendees?.length) {
            event.attendees = options.attendees.map(email => ({
                emailAddress: { address: email },
                type: "required"
            }));
        }

        if (options?.location) {
            event.location = { displayName: options.location };
        }

        if (options?.body) {
            event.body = {
                contentType: "html",
                content: options.body
            };
        }

        const result = await client.api('/me/events').post(event);
        return {
            id: result.id,
            webLink: result.webLink,
            onlineMeeting: result.onlineMeeting
        };
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

    async getAvailableSlots(accessToken: string): Promise<string[]> {
        // Find times for just ME (no attendees) to offer to client
        const result = await this.findMeetingTimes(accessToken, [], "PT30M");
        const slots: any[] = result.meetingTimeSuggestions || [];

        return slots.slice(0, 3).map(s => {
            const date = new Date(s.meetingTimeSlot.start.dateTime);
            return date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        });
    }

    async listEmailsFrom(accessToken: string, email: string): Promise<string[]> {
        const client = this.getClient(accessToken);
        // Filter by specific sender
        const response = await client.api('/me/messages')
            .filter(`from/emailAddress/address eq '${email}'`)
            .top(3)
            .select('subject,bodyPreview,receivedDateTime')
            .get();

        return response.value.map((m: any) =>
            `[${new Date(m.receivedDateTime).toLocaleDateString()}] ${m.subject}: ${m.bodyPreview}`
        );
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

    async createFolder(accessToken: string, parentId: string = 'root', folderName: string): Promise<any> {
        const client = this.getClient(accessToken);
        const driveItem = {
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "rename"
        };
        return await client.api(`/me/drive/items/${parentId}/children`).post(driveItem);
    }

    async createLeadStructure(accessToken: string, companyName: string): Promise<any> {
        try {
            // 1. Ensure 'Leads' root folder exists
            const rootChildren = await this.listDriveItems(accessToken, 'root');
            let leadsFolder = rootChildren.find((i: any) => i.name === 'Leads');
            if (!leadsFolder) {
                leadsFolder = await this.createFolder(accessToken, 'root', 'Leads');
            }

            // 2. Create Company Folder
            const companyFolder = await this.createFolder(accessToken, leadsFolder.id, companyName);

            // 3. Create Subfolders
            await this.createFolder(accessToken, companyFolder.id, '1. Financials');
            await this.createFolder(accessToken, companyFolder.id, '2. Legal');
            await this.createFolder(accessToken, companyFolder.id, '3. Collateral');

            return {
                success: true,
                path: `/Leads/${companyName}`,
                webUrl: companyFolder.webUrl
            };
        } catch (error: any) {
            console.error("Failed to create lead structure:", error);
            throw new Error(`Folder creation failed: ${error.message}`);
        }
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
    async scheduleHandoff(accessToken: string, bdoEmail: string, uwEmail: string, companyName: string): Promise<any> {
        // 1. Find Times
        const attendees = [bdoEmail, uwEmail];
        const timeResult = await this.findMeetingTimes(accessToken, attendees);

        let slot = timeResult.meetingTimeSuggestions?.[0]?.meetingTimeSlot;

        // Fallback: If no common slot found, just pick a slot tomorrow at 10am (Brute force to ensure booking happens)
        if (!slot) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0); // 10 AM
            const end = new Date(tomorrow);
            end.setMinutes(end.getMinutes() + 30); // 30 mins

            slot = {
                start: { dateTime: tomorrow.toISOString(), timeZone: "UTC" },
                end: { dateTime: end.toISOString(), timeZone: "UTC" }
            };
        }

        // 2. Create Event
        const subject = `🤝 Handoff: ${companyName}`;
        const body = `
            <h3>Handoff Meeting: ${companyName}</h3>
            <p><strong>BDO:</strong> ${bdoEmail} <br/> <strong>Underwriter:</strong> ${uwEmail}</p>
            <p>Please review the <a href="https://ampacbrain.azurewebsites.net/?company=${encodeURIComponent(companyName)}">Lead File</a> in SharePoint before this call.</p>
            <ul>
                <li>Is the Application Complete?</li>
                <li>Is the "Use of Proceeds" final?</li>
                <li>Are there any "Hair on the deal" issues?</li>
            </ul>
        `;

        return await this.createEvent(accessToken, subject, slot.start.dateTime, slot.end.dateTime, {
            attendees: attendees,
            body: body,
            isOnlineMeeting: true
        });
    }
}

export const graphService = new GraphService();
