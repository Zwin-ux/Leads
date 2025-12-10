import type { Configuration, PopupRequest } from "@azure/msal-browser";

// AmPac Entra ID App Registration
const clientId = "695a1a76-a38e-4a7b-a88d-81ca61dc4c40";
const tenantId = "cf0a9338-1f99-4a5a-b494-afb40f401dda";

export const msalConfig: Configuration = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin, // Dynamic: works for both dev and prod
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage", // Persist across tabs
        storeAuthStateInCookie: false,
    },
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "openid", "profile", "email"],
};

// Graph API scopes for email/calendar features
export const graphScopes = {
    mail: ["Mail.Read", "Mail.Send"],
    calendar: ["Calendars.ReadWrite"],
    tasks: ["Tasks.ReadWrite"],
    drive: ["Files.ReadWrite"],
    all: ["Mail.Read", "Mail.Send", "Calendars.ReadWrite", "Tasks.ReadWrite"]
};

