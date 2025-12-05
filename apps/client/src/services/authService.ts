import type { UserRole } from '@leads/shared';

export interface User {
    name: string;
    email: string;
    title: string;
    role: UserRole;
}

export const TEAM_MEMBERS: User[] = [
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President", role: "admin" },
    { name: "Ed Ryan", email: "ERyan@ampac.com", title: "EVP, Director of 504 Sales", role: "manager" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of Government Guaranteed Loan Programs", role: "manager" },
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration, Marketing & Training", role: "manager" },
    { name: "Brian Kennedy, Jr", email: "BKennedy@ampac.com", title: "Entrepreneur Ecosystem Director", role: "bdo" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets and Business Development", role: "bdo" },
    { name: "Julie Silvio", email: "JSilvio@ampac.com", title: "EVP, Chief Credit Officer", role: "underwriter" },
    { name: "Jennifer Salazar", email: "JSalazar@ampac.com", title: "Senior Loan Administrator", role: "processor" },
    { name: "Brandon Sellers", email: "BSellers@ampac.com", title: "SVP, IT & Grants Administrator", role: "admin" },
    { name: "Nicole J. Jones", email: "NJones@ampac.com", title: "EVP, Chief Development & Innovation Director", role: "manager" },
    { name: "Kaiesha Davidson", email: "KDavidson@ampac.com", title: "Sr. Accountant", role: "processor" },
    { name: "Jaime Rodriguez", email: "JRodriguez@ampac.com", title: "SVP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Erik Iwashika", email: "EIwashika@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Lucas Sceranka", email: "LSceranka@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Ronnie Sylvia", email: "RSylvia@ampac.com", title: "VP, SBA 504 Specialist", role: "loan_officer" },
    { name: "Ian Aguilar", email: "IAguilar@ampac.com", title: "Business Development Associate", role: "bdo" },
    { name: "Mark Morales", email: "MMorales@ampac.com", title: "SVP, Community Lending & 504 Specialist", role: "loan_officer" },
    { name: "Hunter Bell", email: "HBell@ampac.com", title: "AVP, Business Development Officer", role: "bdo" },
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
}

export const authService = new AuthService();
