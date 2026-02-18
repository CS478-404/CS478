import {
    AppBar,
    Autocomplete,
    Avatar,
    Box,
    Button, Card, CardActions, CardContent, CardHeader, CardMedia,
    Drawer,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Toolbar,
    Tooltip, Typography
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {useState} from "react";

type Props = {
    isLoggedIn: boolean;
    username?: string;
    meals: {
        strTags: string;
        strCategory: string;
        strImageSource: string;
        strMeal: string
    }[];
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onLogout: () => void;
};

function FavoriteIcon() {
    return null;
}

export default function AppLayout({
                                      isLoggedIn,
                                      username,
                                      meals,
                                      onLoginClick,
                                      onRegisterClick,
                                      onLogout
                                  }: Props) {
    let [open, setOpen] = useState<boolean>(false);
    let [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    }

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    }

    return (
        <>
            <AppBar position="fixed">
                <Toolbar sx={{display: "flex", alignItems: "center"}}>
                    <Box sx={{display: "flex", alignItems: "left"}}>
                        <Button value="menu" onClick={toggleDrawer(true)} sx={{color: 'white'}}>
                            <MenuIcon/>
                        </Button>
                        <Drawer open={open} onClose={toggleDrawer(false)}>
                            whatever we decide to put here will go here
                        </Drawer>
                    </Box>
                    <Box sx={{flexGrow: 1, display: "flex", justifyContent: "center"}}>
                        <Autocomplete
                            id="meal-search"
                            freeSolo
                            options={Array.isArray(meals) ? meals.map(m => m.strMeal) : []}
                            renderInput={(params) => <TextField {...params} label="Meals"/>}
                            sx={{width: "100%", color: "white"}}
                        />
                    </Box>
                    <Box sx={{flexGrow: 1, display: "flex", justifyContent: "right", gap: 2}}>
                        {isLoggedIn ? (
                            <>
                                <div>Hello, {username}!</div>
                                <Tooltip title="Open settings">
                                    <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>
                                        <Avatar/>
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    sx={{mt: '45px'}}
                                    id="menu-appbar"
                                    anchorEl={anchorElUser}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleCloseUserMenu}
                                >
                                    <MenuItem>
                                        <Button variant="text">
                                            My Recipes
                                        </Button>
                                    </MenuItem>
                                    <MenuItem onClick={handleCloseUserMenu}>
                                        <Button variant="outlined" color="warning" onClick={onLogout}>
                                            Log out
                                        </Button>
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <>
                                <Button variant="contained" onClick={onLoginClick}>
                                    Log in
                                </Button>
                                <Button variant="outlined" onClick={onRegisterClick} sx={{color: 'white'}}>
                                    Create account
                                </Button>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            {Array.isArray(meals) && meals.map((meal, id) => (
                <Card sx={{maxWidth: 345}} key={id}>
                    <CardHeader>
                        title={meal.strMeal}
                        subheader={meal.strCategory}
                    </CardHeader>
                    <CardMedia
                        component="img"
                        height="194"
                        image={meal.strImageSource}
                    />
                    <CardContent>
                        <Typography component="p" variant="body2" color="textSecondary">
                            {meal.strTags}
                        </Typography>
                    </CardContent>
                    <CardActions disableSpacing>
                        <IconButton aria-label="add to favorites">
                            <FavoriteIcon/>
                        </IconButton>
                    </CardActions>
                </Card>
            ))}
        </>
    );
}
