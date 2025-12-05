import type { UserRole } from '@leads/shared';

export interface User {
    name: string;
    email: string;
    title: string;
    role: UserRole;
    isCommitteeMember?: boolean;  // Credit Committee Member - can approve deals
    isCommitteeParticipant?: boolean;  // Attends committee meetings
    division?: 'SBA' | 'CL' | 'Both';  // SBA 504, Commercial Lending, or Both
}

// Committee structure is defined via isCommitteeMember and isCommitteeParticipant flags below

export const TEAM_MEMBERS: User[] = [
    // Leadership
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President", role: "admin", isCommitteeMember: true },

    // Committee Members (Voting)
    { name: "Julie Silvio", email: "JSilvio@ampac.com", title: "EVP, Chief Credit Officer", role: "underwriter", isCommitteeMember: true },
    { name: "Brian Kennedy, Jr", email: "BKennedy@ampac.com", title: "Entrepreneur Ecosystem Director", role: "bdo", isCommitteeMember: true },
    { name: "Brandon Sellers", email: "BSellers@ampac.com", title: "SVP, IT & Grants Administrator", role: "admin", isCommitteeMember: true },
    { name: "Myron Perryman", email: "MPerryman@ampac.com", title: "SVP, Commercial Lending", role: "manager", isCommitteeMember: true, division: "CL" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of Government Guaranteed Loan Programs", role: "manager", isCommitteeMember: true, division: "Both" },

    // Committee Participants (Non-Voting)
    { name: "Jennifer Premana", email: "JPremana@ampac.com", title: "VP, Loan Processing Manager", role: "processor", isCommitteeParticipant: true },
    { name: "Erik Iwashika", email: "EIwashika@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Ronald Sylvia", email: "RSylvia@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Javier Jimenez", email: "JJimenez@ampac.com", title: "AVP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Brianne Sceranka", email: "BSceranka@ampac.com", title: "VP, Business Development", role: "bdo", isCommitteeParticipant: true },
    { name: "Ian Aguilar", email: "IAguilar@ampac.com", title: "Business Development Associate", role: "bdo", isCommitteeParticipant: true },

    // Management Team
    { name: "Ed Ryan", email: "ERyan@ampac.com", title: "EVP, Director of 504 Sales", role: "manager" },
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration, Marketing & Training", role: "manager" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets and Business Development", role: "bdo" },
    { name: "Nicole J. Jones", email: "NJones@ampac.com", title: "EVP, Chief Development & Innovation Director", role: "manager" },

    // Loan Officers
    { name: "Jaime Rodriguez", email: "JRodriguez@ampac.com", title: "SVP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Lucas Sceranka", email: "LSceranka@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Mark Morales", email: "MMorales@ampac.com", title: "SVP, Community Lending & 504 Specialist", role: "loan_officer" },
    { name: "Hunter Bell", email: "HBell@ampac.com", title: "AVP, Business Development Officer", role: "bdo" },

    // Operations/Processing
    { name: "Jennifer Salazar", email: "JSalazar@ampac.com", title: "Senior Loan Administrator", role: "processor" },
    { name: "Kaiesha Davidson", email: "KDavidson@ampac.com", title: "Sr. Accountant", role: "processor" },

    // Development
    { name: "Mazen Zwin", email: "MZwin@ampac.com", title: "Developer", role: "admin" }
];

const SHARED_PASSWORD = "AmPac@504";

export class AuthService {
    login(email: string, password: string): User | null {
        if (password !== SHARED_PASSWORD) return null;

        const user = TEAM_MEMBERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        return user || null;
    }

    getCurrentUser(): User | null {
        const stored = localStorage.getItem("leads_current_user");
        return stored ? JSON.parse(stored) : null;
    }

    setCurrentUser(user: User) {
        localStorage.setItem("leads_current_user", JSON.stringify(user));
    }

    logout() {
        localStorage.removeItem("leads_current_user");
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
}

export const authService = new AuthService();
