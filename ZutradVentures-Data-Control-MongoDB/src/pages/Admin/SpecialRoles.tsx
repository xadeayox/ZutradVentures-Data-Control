import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import './SpecialRoles.css';
import CheckMarkLogo from '../../assets/images/check-mark.png';

interface User {
    _id: string;
    firstName: string;
    surname: string;
    role: string;
    permissions: { page: string }[];
}

export function SpecialRoles() {
    const [users, setUsers] = useState<User[]>([]);

    // ── Assign role state ──────────────────────────────────────────────────────
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedPage, setSelectedPage] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [assignSuccess, setAssignSuccess] = useState(false);

    // ── Remove role state ──────────────────────────────────────────────────────
    const [removeUserId, setRemoveUserId] = useState('');
    const [removePage, setRemovePage] = useState('');
    const [removeLoading, setRemoveLoading] = useState(false);
    const [removeError, setRemoveError] = useState('');
    const [removeSuccess, setRemoveSuccess] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const response = await apiFetch('/api/users');
            const data = await response.json();
            if (response.ok) setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }

    // Only engineers and receptionists can be assigned special page roles
    const nonAdminUsers = users.filter(
        u => u.role === 'engineer' || u.role === 'receptionist'
    );

    // Pages the selected user already has for the remove dropdown
    const selectedUserForRemove = users.find(u => u._id === removeUserId);
    const existingPermissions = selectedUserForRemove?.permissions || [];

    async function handleAssignRole() {
        setAssignError('');
        setAssignSuccess(false);

        if (!selectedUserId || !selectedPage) {
            setAssignError('Please select a staff member and a role.');
            setTimeout(() => setAssignError(''), 2000);
            return;
        }

        setAssignLoading(true);

        try {
            const response = await apiFetch('/api/users/assign-role', {
                method: 'POST',
                body: JSON.stringify({ userIds: [selectedUserId], page: selectedPage })
            });

            const data = await response.json();

            if (!response.ok) {
                setAssignError(data.message);
                setAssignLoading(false);
                return;
            }

            setSelectedUserId('');
            setSelectedPage('');
            setAssignSuccess(true);
            setTimeout(() => setAssignSuccess(false), 3000);
            fetchUsers();

        } catch (err) {
            setAssignError(` ${err}: Could not connect to the server.`);
        }

        setAssignLoading(false);
    }

    async function handleRemoveRole() {
        setRemoveError('');
        setRemoveSuccess(false);

        if (!removeUserId || !removePage) {
            setRemoveError('Please select a staff member and a role to remove.');
            setTimeout(() => setRemoveError(''), 2000);
            return;
        }

        setRemoveLoading(true);

        try {
            const response = await apiFetch('/api/users/remove-role', {
                method: 'POST',
                body: JSON.stringify({ userId: removeUserId, page: removePage })
            });

            const data = await response.json();

            if (!response.ok) {
                setRemoveError(data.message);
                setRemoveLoading(false);
                return;
            }

            setRemoveUserId('');
            setRemovePage('');
            setRemoveSuccess(true);
            setTimeout(() => setRemoveSuccess(false), 3000);
            fetchUsers();

        } catch (err) {
            setRemoveError(`${err}: Could not connect to the server.`);
        }

        setRemoveLoading(false);
    }

    return (
        <div className="special-roles-container">

            {/* ── Assign Role Section ───────────────────────────────────────── */}
            <h2 className="special-roles-header">Assign Special Roles</h2>
            <div>
                <select
                    title="selection"
                    className="special-roles-input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="" disabled hidden>Select Staff</option>
                    {nonAdminUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.firstName} {user.surname} ({user.role})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <select
                    title="selection"
                    className="special-roles-input"
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                >
                    <option value="" disabled hidden>Select Special Role</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="store">Store</option>
                    <option value="supply">Supply</option>
                </select>
            </div>

            {assignError && <p style={{ color: 'red', fontSize: '0.85rem' }}>{assignError}</p>}

            <div className="special-roles-buttons-container">
                <button
                    type="button"
                    className="special-roles-button"
                    onClick={handleAssignRole}
                    disabled={assignLoading}
                >
                    {assignLoading ? 'Assigning...' : 'Assign Role'}
                </button>
                {assignSuccess && (
                    <span className="check-mark-container">
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Assigned Successfully</span>
                    </span>
                )}
            </div>

            {/* ── Remove Role Section ───────────────────────────────────────── */}
            <h2 className="special-roles-header">Remove Special Roles</h2>
            <div>
                <select
                    title="selection"
                    className="special-roles-input"
                    value={removeUserId}
                    onChange={(e) => {
                        setRemoveUserId(e.target.value);
                        setRemovePage('');
                    }}
                >
                    <option value="" disabled hidden>Select Staff</option>
                    {/* Only show users who have at least one special permission */}
                    {users.filter(u => u.permissions.length > 0).map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.firstName} {user.surname} ({user.role})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <select
                    title="selection"
                    className="special-roles-input"
                    value={removePage}
                    onChange={(e) => setRemovePage(e.target.value)}
                >
                    <option value="" disabled hidden>Select Role to Remove</option>
                    {/* Only show pages the selected user actually has */}
                    {existingPermissions.map((permission) => (
                        <option key={permission.page} value={permission.page}>
                            {permission.page}
                        </option>
                    ))}
                </select>
            </div>

            {removeError && <p style={{ color: 'red', fontSize: '0.85rem' }}>{removeError}</p>}

            <div className="special-roles-buttons-container">
                <button
                    type="button"
                    className="special-roles-button"
                    onClick={handleRemoveRole}
                    disabled={removeLoading}
                >
                    {removeLoading ? 'Removing...' : 'Remove Role'}
                </button>
                {removeSuccess && (
                    <span className="check-mark-container">
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Removed Successfully</span>
                    </span>
                )}
            </div>
        </div>
    );
}
