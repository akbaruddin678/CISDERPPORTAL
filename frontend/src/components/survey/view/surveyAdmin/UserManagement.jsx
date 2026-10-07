import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  useMediaQuery,
  useTheme,
  InputAdornment,
  CardHeader,
  CircularProgress,
  TablePagination
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  School,
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  Search,
  Email,
  Badge,
  Security,
  Group
} from "@mui/icons-material";

// Mock data storage functions - Replace these with your actual API calls
const userStorage = {
  getUsers: () => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [
      {
        id: 1,
        username: 'admin1',
        password: 'admin123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        isActive: true
      },
      {
        id: 2,
        username: 'teacher1',
        password: 'teacher123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        role: 'teacher',
        department: 'Computer Science',
        isActive: true
      },
      {
        id: 3,
        username: 'student1',
        password: 'student123',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        role: 'student',
        department: 'Computer Science',
        program: 'BSc Computer Science',
        semester: 'Semester 4',
        isActive: true
      }
    ];
  },

  addUser: (userData) => {
    const users = userStorage.getUsers();
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  },

  updateUser: (userId, userData) => {
    const users = userStorage.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData, updatedAt: new Date().toISOString() };
      localStorage.setItem('users', JSON.stringify(users));
      return users[userIndex];
    }
    return null;
  },

  deleteUser: (userId) => {
    const users = userStorage.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    return true;
  },

  getDepartments: () => {
    return ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration'];
  },

  getPrograms: () => {
    return ['BSc Computer Science', 'BSc Electrical Engineering', 'BSc Mechanical Engineering', 'BSc Civil Engineering', 'BBA Business Administration'];
  },

  getSemesters: () => {
    return ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
  },

  getUserStats: () => {
    const users = userStorage.getUsers();
    return {
      total: users.length,
      teachers: users.filter(user => user.role === 'teacher').length,
      students: users.filter(user => user.role === 'student').length,
      admins: users.filter(user => user.role === 'admin').length
    };
  }
};

// Export the functions individually
export const getUsers = userStorage.getUsers;
export const addUser = userStorage.addUser;
export const updateUser = userStorage.updateUser;
export const deleteUser = userStorage.deleteUser;
export const getDepartments = userStorage.getDepartments;
export const getPrograms = userStorage.getPrograms;
export const getSemesters = userStorage.getSemesters;
export const getUserStats = userStorage.getUserStats;

const UserManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    department: "",
    program: "",
    semester: "",
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setUsers(getUsers());
      setDepartments(getDepartments());
      setPrograms(getPrograms());
      setSemesters(getSemesters());
      setStats(getUserStats());
      setLoading(false);
    }, 500);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || "",
        program: user.program || "",
        semester: user.semester || "",
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
        department: departments[0] || "",
        program: programs[0] || "",
        semester: semesters[0] || "",
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.password || !formData.firstName || !formData.lastName) {
      setAlert({
        open: true,
        message: "Please fill in all required fields",
        severity: "error"
      });
      return;
    }

    // Validate role-specific required fields
    if (formData.role === 'student') {
      if (!formData.department || !formData.program || !formData.semester) {
        setAlert({
          open: true,
          message: "Please fill in class, program, and section for student",
          severity: "error"
        });
        return;
      }
    }

    if (formData.role === 'teacher') {
      if (!formData.department) {
        setAlert({
          open: true,
          message: "Please select a class for teacher",
          severity: "error"
        });
        return;
      }
    }

    try {
      if (editingUser) {
        updateUser(editingUser.id, formData);
        setAlert({
          open: true,
          message: "User updated successfully",
          severity: "success"
        });
      } else {
        addUser(formData);
        setAlert({
          open: true,
          message: "User created successfully",
          severity: "success"
        });
      }
      loadData();
      handleCloseDialog();
    } catch (error) {
      setAlert({
        open: true,
        message: "Error saving user",
        severity: "error"
      });
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(userId);
      loadData();
      setAlert({
        open: true,
        message: "User deleted successfully",
        severity: "success"
      });
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'teacher': return <School />;
      case 'student': return <Person />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  const filteredUsers = () => {
    let filtered = users;
    
    switch (tab) {
      case 0: filtered = filtered.filter(user => user.role === 'teacher'); break;
      case 1: filtered = filtered.filter(user => user.role === 'student'); break;
      case 2: filtered = filtered.filter(user => user.role === 'admin'); break;
      default: filtered = filtered;
    }
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.semester?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = filteredUsers().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight={600}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  // Render different table headers based on role
  const renderTableHeaders = () => {
    switch (tab) {
      case 0: // Teachers
        return (
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
              {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>}
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
        );
      case 1: // Students
        return (
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
              {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>}
              {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>}
              {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>}
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
        );
      case 2: // Admins
        return (
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
        );
      default:
        return null;
    }
  };

  // Render different table rows based on role
  const renderTableRows = () => {
    return paginatedUsers.map((user) => (
      <TableRow key={user.id} hover>
        {/* User Info Cell */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {getRoleIcon(user.role)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={500}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              {isMobile && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                  {/* Mobile view for Teachers */}
                  {user.role === 'teacher' && user.department && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Dept: {user.department}
                    </Typography>
                  )}
                  {/* Mobile view for Students */}
                  {user.role === 'student' && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" display="block">
                        Dept: {user.department}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Program: {user.program}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Semester: {user.semester}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </TableCell>

        {/* Role-specific columns */}
        {user.role === 'teacher' && !isMobile && (
          <TableCell>
            <Typography variant="body2">
              {user.department}
            </Typography>
          </TableCell>
        )}

        {user.role === 'student' && !isMobile && (
          <>
            <TableCell>
              <Typography variant="body2">
                {user.department}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {user.program}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={user.semester}
                color="primary"
                variant="outlined"
                size="small"
              />
            </TableCell>
          </>
        )}

        {/* Status Cell */}
        <TableCell>
          <Chip
            label={user.isActive ? 'Active' : 'Inactive'}
            color={user.isActive ? 'success' : 'default'}
            size="small"
          />
        </TableCell>

        {/* Actions Cell */}
        <TableCell align="center">
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleOpenDialog(user)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Password">
              <IconButton
                onClick={() => togglePasswordVisibility(user.id)}
              >
                {showPassword[user.id] ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Stack>
          {showPassword[user.id] && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Password: {user.password}
            </Typography>
          )}
        </TableCell>
      </TableRow>
    ));
  };

  const getTabLabel = () => {
    switch (tab) {
      case 0: return `Teachers (${users.filter(u => u.role === 'teacher').length})`;
      case 1: return `Students (${users.filter(u => u.role === 'student').length})`;
      case 2: return `Admins (${users.filter(u => u.role === 'admin').length})`;
      default: return '';
    }
  };

  return (
    <Box sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage system users and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ textTransform: 'none' }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Search and Tabs */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'stretch' : 'center' }}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(e, newValue) => {
              setTab(newValue);
              setPage(0);
            }}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab icon={<School />} label={`Teachers (${users.filter(u => u.role === 'teacher').length})`} />
            <Tab icon={<Person />} label={`Students (${users.filter(u => u.role === 'student').length})`} />
            <Tab icon={<AdminPanelSettings />} label={`Admins (${users.filter(u => u.role === 'admin').length})`} />
          </Tabs>
        </Paper>

        {/* Users Table */}
        <Card>
          <CardHeader
            title={getTabLabel()}
            action={
              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {Math.ceil(filteredUsers().length / rowsPerPage)}
              </Typography>
            }
          />
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    {renderTableHeaders()}
                    <TableBody>
                      {renderTableRows()}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredUsers().length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Department Field - Required for Students and Teachers */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  label="Class"
                  required={formData.role === 'student' || formData.role === 'teacher'}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Program Field - Only for Students */}
            {formData.role === 'student' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Program</InputLabel>
                  <Select
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    label="Program"
                    required
                  >
                    {programs.map((program) => (
                      <MenuItem key={program} value={program}>
                        {program}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Semester Field - Only for Students */}
            {formData.role === 'student' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    label="Section"
                    required
                  >
                    {semesters.map((semester) => (
                      <MenuItem key={semester} value={semester}>
                        {semester}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;