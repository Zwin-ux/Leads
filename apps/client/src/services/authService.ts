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
    // Leadership & Management
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President", role: "admin", isCommitteeMember: true },
    { name: "Julie Silvio", email: "JSilvio@ampac.com", title: "EVP, Chief Credit Officer", role: "underwriter", isCommitteeMember: true },
    { name: "Edmund Ryan", email: "Eryan@ampac.com", title: "EVP, Director of 504 Sales", role: "manager" }, // Known as Ed Ryan
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration", role: "manager" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets and Business Development", role: "bdo" },
    { name: "Nicole J. Jones", email: "NJones@ampac.com", title: "EVP, Chief Development & Innovation Director", role: "manager" },
    { name: "Brian Kennedy Jr.", email: "Bkennedyjr@ampac.com", title: "Entrepreneur Ecosystem Director", role: "bdo", isCommitteeMember: true },
    { name: "Brandon Sellers", email: "BSellers@ampac.com", title: "SVP, IT & Grants Administrator", role: "admin", isCommitteeMember: true },
    { name: "Myron Perryman", email: "MPerryman@ampac.com", title: "SVP, Commercial Lending", role: "manager", isCommitteeMember: true, division: "CL" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of Government Guaranteed Loan Programs", role: "manager", isCommitteeMember: true, division: "Both" },

    // Committee Participants (Voting/Non-Voting context preserved where known)
    { name: "Jennifer Pramana", email: "JPramana@ampac.com", title: "VP, Loan Processing Manager", role: "processor", isCommitteeParticipant: true },
    { name: "Erik Iwashika", email: "EIwashika@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true },
    { name: "Ronald Sylvia", email: "RSylvia@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer", isCommitteeParticipant: true }, // Note: Not in Entra list provided, preserving if still active, otherwise might be stale. Keeping for safety.
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
