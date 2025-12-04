export interface User {
    name: string;
    email: string;
    title: string;
}

const TEAM_MEMBERS: User[] = [
    { name: "Hilda Kennedy", email: "HKennedy@ampac.com", title: "Founder/President" },
    { name: "Ed Ryan", email: "ERyan@ampac.com", title: "EVP, Director of 504 Sales" },
    { name: "Jaime Rodriguez", email: "JRodriguez@ampac.com", title: "SVP, SBA 504 Specialist" },
    { name: "Janine Warren", email: "JWarren@ampac.com", title: "EVP, Director of Loan Integration" },
    { name: "Jeff Sceranka", email: "JSceranka@ampac.com", title: "EVP, New Markets" },
    { name: "Erik Iwashika", email: "EIwashika@ampac.com", title: "VP, SBA 504 Specialist" },
    { name: "Lucas Sceranka", email: "LSceranka@ampac.com", title: "VP, SBA 504 Specialist" },
    { name: "Ronnie Sylvia", email: "RSylvia@ampac.com", title: "VP, SBA 504 Specialist" },
    { name: "Ian Aguilar", email: "IAguilar@ampac.com", title: "Business Development Associate" },
    { name: "Ahmed Zwin", email: "AZwin@ampac.com", title: "EVP, Director of GGLP" },
    { name: "Mark Morales", email: "MMorales@ampac.com", title: "SVP, Community Lending" },
    { name: "Hunter Bell", email: "HBell@ampac.com", title: "AVP, Business Development Officer" },
    { name: "Brian Kennedy, Jr", email: "BKennedy@ampac.com", title: "Entrepreneur Ecosystem Director" },
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
