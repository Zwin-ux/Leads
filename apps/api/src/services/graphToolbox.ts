import { graphService } from "./graphService";

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
}

export class GraphToolbox {
    getTools(): ToolDefinition[] {
        return [
            {
                name: "send_email",
                description: "Send an email to a recipient.",
                parameters: {
                    type: "object",
                    properties: {
                        to: { type: "string", description: "Email address of the recipient" },
                        subject: { type: "string", description: "Subject of the email" },
                        body: { type: "string", description: "HTML body content of the email" }
                    },
                    required: ["to", "subject", "body"]
                }
            },
            {
                name: "list_emails",
                description: "List recent emails, optionally filtered.",
                parameters: {
                    type: "object",
                    properties: {
                        filter: { type: "string", description: "OData filter string (e.g., \"from/emailAddress/address eq 'user@example.com'\")" }
                    }
                }
            },
            {
                name: "create_event",
                description: "Create a calendar event with optional Teams meeting link.",
                parameters: {
                    type: "object",
                    properties: {
                        subject: { type: "string", description: "Event title" },
                        start: { type: "string", description: "Start time (ISO 8601)" },
                        end: { type: "string", description: "End time (ISO 8601)" },
                        attendees: { type: "array", items: { type: "string" }, description: "List of attendee email addresses" },
                        location: { type: "string", description: "Meeting location or room" },
                        body: { type: "string", description: "Meeting description/agenda (HTML)" },
                        isOnlineMeeting: { type: "boolean", description: "Create as Teams online meeting" }
                    },
                    required: ["subject", "start", "end"]
                }
            },
            {
                name: "find_meeting_times",
                description: "Find available meeting times for a group of attendees.",
                parameters: {
                    type: "object",
                    properties: {
                        attendees: { type: "array", items: { type: "string" }, description: "List of attendee email addresses" },
                        duration: { type: "string", description: "Duration in ISO 8601 format (e.g., PT30M)" }
                    },
                    required: ["attendees"]
                }
            },
            {
                name: "upload_file",
                description: "Upload a file to OneDrive root.",
                parameters: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Name of the file" },
                        content: { type: "string", description: "Text content of the file" }
                    },
                    required: ["fileName", "content"]
                }
            },
            {
                name: "list_drive_items",
                description: "List items in a OneDrive folder.",
                parameters: {
                    type: "object",
                    properties: {
                        folderId: { type: "string", description: "Folder ID (default: root)" }
                    }
                }
            },
            {
                name: "create_contact",
                description: "Create a new contact.",
                parameters: {
                    type: "object",
                    properties: {
                        givenName: { type: "string" },
                        surname: { type: "string" },
                        emailAddresses: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    address: { type: "string" },
                                    name: { type: "string" }
                                }
                            }
                        },
                        businessPhones: { type: "array", items: { type: "string" } }
                    },
                    required: ["givenName"]
                }
            },
            {
                name: "create_task",
                description: "Create a task in a ToDo list.",
                parameters: {
                    type: "object",
                    properties: {
                        listId: { type: "string", description: "ID of the task list" },
                        title: { type: "string", description: "Title of the task" }
                    },
                    required: ["listId", "title"]
                }
            }
        ];
    }

    async executeTool(accessToken: string, toolName: string, args: any): Promise<any> {
        switch (toolName) {
            case "send_email":
                await graphService.sendEmail(accessToken, args.to, args.subject, args.body);
                return { success: true, message: "Email sent" };
            case "list_emails":
                return await graphService.listEmails(accessToken, args.filter);
            case "create_event":
                const eventResult = await graphService.createEvent(accessToken, args.subject, args.start, args.end, {
                    attendees: args.attendees,
                    location: args.location,
                    body: args.body,
                    isOnlineMeeting: args.isOnlineMeeting
                });
                return { success: true, message: "Event created", ...eventResult };
            case "find_meeting_times":
                return await graphService.findMeetingTimes(accessToken, args.attendees, args.duration);
            case "upload_file":
                return await graphService.uploadFile(accessToken, args.fileName, args.content);
            case "list_drive_items":
                return await graphService.listDriveItems(accessToken, args.folderId);
            case "create_contact":
                return await graphService.createContact(accessToken, args);
            case "create_task":
                return await graphService.createTask(accessToken, args.listId, args.title);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
}

export const graphToolbox = new GraphToolbox();
