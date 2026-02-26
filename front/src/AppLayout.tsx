import {
    AppBar,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Drawer,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Toolbar,
    Tooltip,
    Typography
} from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import MenuIcon from "@mui/icons-material/Menu";
import {useState} from "react";
import {Form} from "react-router-dom";

type Props = {
    isLoggedIn: boolean;
    username?: string;
    meals: {
        strMealThumb: string;
        strTags: string;
        strCategory: string;
        strMeal: string
    }[];
    ingredients: {
        name: string;
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
                                      ingredients,
                                      onLoginClick,
                                      onRegisterClick,
                                      onLogout
                                  }: Props) {
    let [open, setOpen] = useState<boolean>(false);
    let [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    let [searchInput, setSearchInput] = useState<string>("");
    let [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [appliedIngredients, setAppliedIngredients] = useState<string[]>([]);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    }

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    }

    const filteredMeals = meals
        .filter(meal => {
            if (appliedIngredients.length === 0) return true;

            if (!meal.strTags) return false;

            return appliedIngredients.every(ingredient =>
                meal.strTags
                    .toLowerCase()
                    .includes(ingredient.toLowerCase())
            );
        })
        .filter(meal => {
            if (searchQuery.trim() === "") return true;

            return meal.strMeal
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        });

    return (
        <>
            <AppBar position="fixed">
                <Toolbar sx={{display: "flex", alignItems: "center"}}>
                    <Box sx={{display: "flex", alignItems: "left"}}>
                        <Button value="menu" onClick={toggleDrawer(true)} sx={{color: 'white'}}>
                            <MenuIcon/>
                        </Button>
                        <Drawer open={open} onClose={toggleDrawer(false)}>
                            <Form>
                                <Autocomplete
                                    multiple
                                    options={ingredients}
                                    disableCloseOnSelect
                                    getOptionLabel={(ingredient) => ingredient.name}
                                    value={ingredients.filter(i => selectedIngredients.includes(i.name))}
                                    onChange={(_, newValue) => {
                                        setSelectedIngredients(newValue.map(i => i.name));
                                    }}
                                    renderOption={(props, option, {selected}) => {
                                        const {key, ...optionProps} = props;
                                        const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                                        return (
                                            <li key={key} {...optionProps}>
                                                <SelectionIcon
                                                    fontSize="small"
                                                    style={{marginRight: 8, padding: 9, boxSizing: 'content-box'}}
                                                />
                                                {option.name}
                                            </li>
                                        );
                                    }}
                                    style={{width: 500, margin: '10px'}}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Ingredients" placeholder="Ingredients"/>
                                    )}
                                />
                                <Button
                                    variant="contained"
                                    sx={{ margin: '10px' }}
                                    onClick={() => {
                                        setAppliedIngredients(selectedIngredients);
                                        setOpen(false);
                                    }}
                                >
                                    Filter
                                </Button>
                            </Form>
                        </Drawer>
                    </Box>
                    <Box sx={{flexGrow: 1, display: "flex", justifyContent: "center"}}>
                        <Autocomplete
                            id="meal-search"
                            freeSolo
                            options={Array.isArray(meals) ? meals.map(m => m.strMeal) : []}
                            onInputChange={(_event, value) => setSearchInput(value)}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    label="Search meals..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setSearchQuery(searchInput);
                                        }
                                    }}
                                />
                            }
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
            <Grid container spacing={3} marginLeft={10} marginTop={10}>
                {filteredMeals.map((meal, id) => (
                    <Grid key={id}>
                        <Card sx={{width: 250, height: 300}} key={id} variant="outlined">
                            <CardMedia
                                component="img"
                                sx={{maxHeight: 200}}
                                image={meal.strMealThumb}
                                alt={meal.strMeal}
                            />
                            <CardContent>
                                <Typography component="h1" color="textPrimary" sx={{
                                    fontSize: 25,
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                }}>
                                    {meal.strMeal}
                                </Typography>
                                <Typography component="h4" color="textSecondary">
                                    {meal.strCategory}
                                </Typography>
                                <Typography component="p" variant="body2" color="textDisabled">
                                    {meal.strTags}
                                </Typography>
                            </CardContent>
                            <CardActions disableSpacing>
                                <IconButton aria-label="add to favorites">
                                    <FavoriteIcon/>
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
}
