export interface User {
    name: string;
    email: string;
    title: string;
}

export const TEAM_MEMBERS: User[] = [
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President" },
    { name: "Ed Ryan", email: "ERyan@ampac.com", title: "EVP, Director of 504 Sales" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of GGLP" },
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration" },
    { name: "Brian Kennedy, Jr", email: "BKennedy@ampac.com", title: "Entrepreneur Ecosystem Director" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets" },
    { name: "Julie Silvio", email: "JSilvio@ampac.com", title: "EVP, Chief Credit Officer" },
    { name: "Jennifer Salazar", email: "JSalazar@ampac.com", title: "Senior Loan Administrator" },
    { name: "Brandon Sellers", email: "BSellers@ampac.com", title: "SVP, IT & Grants Administrator" },
    { name: "Nicole J. Jones", email: "NJones@ampac.com", title: "EVP, Chief Development & Innovation Director" },
    { name: "Kaiesha Davidson", email: "KDavidson@ampac.com", title: "Sr. Accountant" },
    { name: "Mazen Zwin", email: "MZwin@ampac.com", title: "Developer" }
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
