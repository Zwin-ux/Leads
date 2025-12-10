
import type { UserRole } from '@leads/shared';
import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';

export interface User {
    name: string;
    email: string;
    title: string;
    role: UserRole;
    isCommitteeMember?: boolean;
    isCommitteeParticipant?: boolean;
    division?: 'SBA' | 'CL' | 'Both';
    // Entra ID specific
    entraId?: string; // Object ID from Azure AD
}

// Existing team members for role resolution
export const TEAM_MEMBERS: User[] = [
    // Leadership & Management
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President", role: "admin", isCommitteeMember: true },
    { name: "Julie Silvio", email: "JSilvio@ampac.com", title: "EVP, Chief Credit Officer", role: "underwriter", isCommitteeMember: true },
    { name: "Edmund Ryan", email: "Eryan@ampac.com", title: "EVP, Director of 504 Sales", role: "manager" },
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration", role: "manager" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets and Business Development", role: "bdo" },
    { name: "Nicole J. Jones", email: "NJones@ampac.com", title: "EVP, Chief Development & Innovation Director", role: "manager" },
    { name: "Brian Kennedy Jr.", email: "Bkennedyjr@ampac.com", title: "Entrepreneur Ecosystem Director", role: "bdo", isCommitteeMember: true },
    { name: "Brandon Sellers", email: "BSellers@ampac.com", title: "SVP, IT & Grants Administrator", role: "admin", isCommitteeMember: true },
    { name: "Myron Perryman", email: "MPerryman@ampac.com", title: "SVP, Commercial Lending", role: "manager", isCommitteeMember: true, division: "CL" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of Government Guaranteed Loan Programs", role: "manager", isCommitteeMember: true, division: "Both" },

    // Committee Participants
    { name: "Jennifer Pramana", email: "JPramana@ampac.com", title: "VP, Loan Processing Manager", role: "processor", isCommitteeParticipant: true },
    { name: "Erik Iwashika", email: "EIwashika@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Ronald Sylvia", email: "RSylvia@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Javier Jimenez", email: "JJimenez@ampac.com", title: "AVP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Brianne Sceranka", email: "BSceranka@ampac.com", title: "VP, Business Development", role: "bdo", isCommitteeParticipant: true },
    { name: "Ian Aguilar", email: "Iaguilar@ampac.com", title: "Business Development Associate", role: "bdo", isCommitteeParticipant: true },

    // Loan Officers & Sales
    { name: "Jaime Rodriguez", email: "JRodriguez@ampac.com", title: "SVP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Lucas Sceranka", email: "LSceranka@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Mark Morales", email: "MMorales@ampac.com", title: "SVP, Community Lending & 504 Specialist", role: "loan_officer" },
    { name: "Hunter Bell", email: "HBell@ampac.com", title: "AVP, Business Development Officer", role: "bdo" },
    { name: "Alton W. Do", email: "Alton@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Arthur Ollivant", email: "AOllivant@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Ashley Peltier", email: "APeltier@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Ashley Whisler", email: "AWhisler@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Braya Alford", email: "BAlford@ampac.com", title: "Business Development Associate", role: "bdo" },
    { name: "Brienne Stewart", email: "Bstewart@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Caleb Edgar", email: "CEdgar@ampac.com", title: "Business Development Officer", role: "bdo" },
    { name: "Carlos Gonzalez", email: "Cgonzalez@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Chris Bell", email: "CMBell@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "David Poole", email: "DPoole@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Derek Ofoma", email: "Dofoma@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "James Martin III", email: "JMartiniii@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Janine Peltier", email: "JPeltier@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Jose Juan Vega", email: "jvega@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Joseph Choi", email: "JChoi@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Justin Jones", email: "JJones@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Leroy Onishi", email: "LOnishi@ampac.com", title: "Loan Officer", role: "loan_officer" },
    { name: "Makayla Garibay", email: "MGaribay@ampac.com", title: "Business Development Associate", role: "bdo" },
    { name: "Marcella Alaniz", email: "MAlaniz@ampac.com", title: "Loan Officer", role: "loan_officer" },

    // Operations / Admin / Support
    { name: "Jennifer Salazar", email: "JGSalazar@ampac.com", title: "Senior Loan Administrator", role: "processor" },
    { name: "Kaiesha Davidson", email: "KDavidson@ampac.com", title: "Sr. Accountant", role: "processor" },
    { name: "Ana Rubalacaba", email: "ARubalcaba@ampac.com", title: "Operations", role: "processor" },
    { name: "Damaris Whisler", email: "DWhisler@ampac.com", title: "Operations", role: "processor" },
    { name: "Dana Bush", email: "DBush@ampac.com", title: "Operations", role: "processor" },
    { name: "Elizabeth Coronado Villanueva", email: "EVillanueva@ampac.com", title: "Operations", role: "processor" },
    { name: "Eric Ebel", email: "eebel@ampac.com", title: "Operations", role: "processor" },
    { name: "Evelyn Kennedy", email: "EPKennedy@ampac.com", title: "Operations", role: "processor" },
    { name: "Janette St. Jean", email: "jstjean@ampac.com", title: "Operations", role: "processor" },
    { name: "Lakisha Gant", email: "Lgant@ampac.com", title: "Operations", role: "processor" },
    { name: "Lelia Kennedy", email: "LKennedy@ampac.com", title: "Operations", role: "processor" },

    // Developer
    { name: "Mazen Zwin", email: "MZwin@ampac.com", title: "Developer", role: "admin" }
];

// MSAL Instance
const msalInstance = new PublicClientApplication(msalConfig);

export class AuthService {
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;
        await msalInstance.initialize();
        // Handle redirect promise (for redirect flow)
        await msalInstance.handleRedirectPromise();
        this.initialized = true;
    }

    // SSO Login via Microsoft
    async login(): Promise<User | null> {
        await this.initialize();
        try {
            const response = await msalInstance.loginPopup(loginRequest);
            if (response.account) {
                return this.resolveUser(response.account);
            }
            return null;
        } catch (error) {
            console.error("Login failed:", error);
            return null;
        }
    }

    // Get current logged-in user
    getCurrentUser(): User | null {
        // 1. Check Dev Override first
        const devOverride = localStorage.getItem("leads_dev_user_override");
        if (devOverride) {
            try {
                return JSON.parse(devOverride);
            } catch (e) {
                console.error("Failed to parse dev user override", e);
                localStorage.removeItem("leads_dev_user_override");
            }
        }

        // 2. Check MSAL
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            return this.resolveUser(accounts[0]);
        }
        return null;
    }

    // Resolve Entra ID account to internal User
    private resolveUser(account: AccountInfo): User {
        const email = account.username; // Usually the email
        const teamMember = TEAM_MEMBERS.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (teamMember) {
            return {
                ...teamMember,
                entraId: account.localAccountId,
                name: account.name || teamMember.name, // Prefer AD name
            };
        }

        // Unknown user - default to read-only BDO
        return {
            name: account.name || email,
            email: email,
            title: "External User",
            role: "bdo",
            entraId: account.localAccountId,
        };
    }

    // Logout
    async logout(): Promise<void> {
        await this.initialize();
        await msalInstance.logoutPopup();
    }

    // Get access token for API calls
    async getAccessToken(scopes: string[] = ["User.Read"]): Promise<string | null> {
        await this.initialize();
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) return null;

        try {
            const response = await msalInstance.acquireTokenSilent({
                scopes,
                account: accounts[0],
            });
            return response.accessToken;
        } catch (error) {
            console.error("Token acquisition failed:", error);
            // Try interactive if silent fails
            try {
                const response = await msalInstance.acquireTokenPopup({ scopes });
                return response.accessToken;
            } catch (popupError) {
                console.error("Interactive token acquisition failed:", popupError);
                return null;
            }
        }
    }

    // Check if user can approve deals in committee
    canApproveDeals(user: User): boolean {
        return user.isCommitteeMember === true || user.role === 'admin';
    }

    // Check if user participates in committee meetings
    isInCommittee(user: User): boolean {
        return user.isCommitteeMember === true || user.isCommitteeParticipant === true;
    }

    // Get committee members only
    getCommitteeMembers(): User[] {
        return TEAM_MEMBERS.filter(u => u.isCommitteeMember);
    }

    // Get committee participants
    getCommitteeParticipants(): User[] {
        return TEAM_MEMBERS.filter(u => u.isCommitteeParticipant);
    }

    // Legacy compatibility - set user manually (for dev mode bypass)
    setCurrentUser(user: User): void {
        localStorage.setItem("leads_dev_user_override", JSON.stringify(user));
    }

    // Get MSAL instance for advanced usage
    getMsalInstance(): PublicClientApplication {
        return msalInstance;
    }
}

export const authService = new AuthService();
