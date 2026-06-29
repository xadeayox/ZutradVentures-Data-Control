import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar";
import { Store } from "../../components/Store";
import { Supply } from "../../components/Supply";
import { Maintenance } from "../../components/Maintenance";
import { Reports } from "../../components/Reports";
import { Clients } from "../../components/Clients";
import { Administrator } from "../../components/Administrator";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import './AllSubPage.css';
import { HamBurgerLinks } from "../../components/HamBurgerLinks";

interface SearchTermProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

interface Permission {
    page: string;
}

interface User {
    _id: string;
    firstName: string;
    surname: string;
    email: string;
    role: string;
    permissions: Permission[];
}

export default function AllUsers({
    searchTerm,
    setSearchTerm
}: SearchTermProps) {

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(
        localStorage.getItem('user') || '{"id":0}'
    );

    useEffect(() => {
        fetchUsers();
    }, []);

useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
            return;
        }

        const query = searchTerm.toLowerCase();

        const filtered = users.filter(user =>
            `${user.firstName} ${user.surname}`
                .toLowerCase()
                .includes(query) ||
            user.role.toLowerCase().includes(query)
        );

        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    async function fetchUsers() {
        try {
            const response = await apiFetch('/api/users');

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();

            setUsers(data.users);
            setFilteredUsers(data.users);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteUser(id: string) {
        const selectedUser = users.find(user => user._id === id);

        const confirmed = window.confirm(
            `Delete ${selectedUser?.firstName} ${selectedUser?.surname}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await apiFetch(`/api/users/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setUsers(prev =>
                prev.filter(user => user._id !== id)
            );

            setFilteredUsers(prev =>
                prev.filter(user => user._id !== id)
            );

        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete user'
            );
        }
    }

    return (
        <div className="all-sub-page-container">
            <title>All Employees</title>

            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <div className="all-sub-page-contents">

                {
                    loading && (
                        <h3 className="sub-page-card-contents">Loading users...</h3>
                    )
                }

                {
                    !loading &&
                    filteredUsers.length === 0 && (
                        <h3 className="sub-page-card-header">No users found.</h3>
                    )
                }

                {
                    filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className="sub-page-card"
                        >
                            <h3 className="sub-page-card-header">
                                <span className="sub-full-name">
                                    {user.firstName} {user.surname}
                                </span>
                                : {user.role}
                            </h3>

                            <p className="sub-page-card-contents">
                                Email: {user.email}
                            </p>

                            <p className="sub-page-card-contents">
                                Permissions:
                                {
                                    user.permissions.length > 0
                                        ? ` ${user.permissions
                                            .map(permission => permission.page)
                                            .join(', ')}`
                                        : ' None'
                                }
                            </p>

                            <p>
                                <button
                                    className="sub-page-delete-button"
                                    disabled={currentUser?.id === user._id}
                                    onClick={() => deleteUser(user._id)}
                                >
                                    {
                                        currentUser?.id === user._id
                                            ? 'Current User'
                                            : 'Delete User'
                                    }
                                </button>
                            </p>
                        </div>
                    ))
                }

            </div>
            <HamBurgerLinks />                    
            <Administrator />
            <Store />
            <Supply />
            <Maintenance />
            <Reports />
            <Clients />
            <Footer />
        </div>
    );
}