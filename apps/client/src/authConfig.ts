import type { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "e6b8a64a-98cc-4fbd-8b7b-888a282fb464", // User provided ID
        authority: "https://login.microsoftonline.com/common",
        redirectUri: import.meta.env.VITE_REDIRECT_URI || "https://localhost:3000/assets/office-js/auth-end.html",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "Mail.Send", "Calendars.ReadWrite"],
};
