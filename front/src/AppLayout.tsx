import {
    AppBar,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
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
import {useEffect, useState} from "react";
import {Form, useNavigate} from "react-router-dom";

type Props = {
    isLoggedIn: boolean;
    username?: string;
    onOpenUserSettings: () => void;
    meals: {
        id: string;
        strMealThumb: string;
        strTags: string;
        strCategory: string;
        strMeal: string
    }[];
    ingredients: {
        name: string;
    }[];
    categories: {
        strCategory: string;
    }[];
    areas: {
        strArea: string;
    }[];
    tags: string[];
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
                                      onOpenUserSettings,
                                      meals,
                                      ingredients,
                                      areas,
                                      tags,
                                      categories,
                                      onLoginClick,
                                      onRegisterClick,
                                      onLogout
                                  }: Props) {
    let [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    let [searchInput, setSearchInput] = useState<string>("");
    let [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [filteredMeals, setFilteredMeals] = useState(meals);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        setFilteredMeals(Array.isArray(meals) ? meals : []);
    }, [meals]);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    }

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    }

    const visibleMeals = filteredMeals
        .filter(meal => {
            if (searchQuery.trim() === "") return true;

            return meal.strMeal.toLowerCase().includes(searchQuery.toLowerCase());
        });

    return (
        <Box sx={{display: 'flex'}}>
            <AppBar position="fixed" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
                <Toolbar sx={{display: "flex", alignItems: "center"}}>
                    <Box sx={{flexGrow: 1, display: "flex", justifyContent: "center"}}>
                        <Autocomplete
                            id="meal-search"
                            freeSolo
                            options={Array.isArray(filteredMeals) ? filteredMeals.map(m => m.strMeal) : []}
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
                                    <MenuItem
                                        onClick={() => {
                                            handleCloseUserMenu();
                                            onOpenUserSettings();
                                        }}
                                    >
                                        <Button variant="text">User Settings</Button>
                                    </MenuItem>
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
            <Drawer variant="permanent" anchor="left"
                    sx={{width: 260, flexShrink: 0, [`& .MuiDrawer-paper`]: {width: 280, boxSizing: 'border-box'}}}>
                <Box sx={{marginTop: 9}}>
                    <Typography variant="h6" textAlign="left" marginLeft="10px">
                        Filter by:
                    </Typography>
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
                            style={{width: 240, margin: '10px'}}
                            renderInput={(params) => (
                                <TextField {...params} label="Ingredients" placeholder="Ingredients"/>
                            )}
                        />
                        <Autocomplete
                            multiple
                            options={categories}
                            disableCloseOnSelect
                            getOptionLabel={(category) => category.strCategory}
                            value={categories.filter(c => selectedCategories.includes(c.strCategory))}
                            onChange={(_, newValue) => {
                                setSelectedCategories(newValue.map(c => c.strCategory));
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
                                        {option.strCategory}
                                    </li>
                                );
                            }}
                            style={{width: 240, margin: '10px'}}
                            renderInput={(params) => (
                                <TextField {...params} label="Category" placeholder="Category"/>
                            )}
                        />
                        <Autocomplete
                            multiple
                            options={areas}
                            disableCloseOnSelect
                            getOptionLabel={(area) => area.strArea}
                            value={areas.filter(a => selectedAreas.includes(a.strArea))}
                            onChange={(_, newValue) => {
                                setSelectedAreas(newValue.map(a => a.strArea));
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
                                        {option.strArea}
                                    </li>
                                );
                            }}
                            style={{width: 240, margin: '10px'}}
                            renderInput={(params) => (
                                <TextField {...params} label="Area" placeholder="Area"/>
                            )}
                        />
                        <Autocomplete
                            multiple
                            options={tags}
                            disableCloseOnSelect
                            getOptionLabel={(tag) => tag}
                            value={selectedTags}
                            onChange={(_, newValue) => {
                                setSelectedTags(newValue);
                            }}
                            renderOption={(props, option, { selected }) => {
                                const { key, ...optionProps } = props;
                                const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                                return (
                                    <li key={key} {...optionProps}>
                                        <SelectionIcon
                                            fontSize="small"
                                            style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                                        />
                                        {option}
                                    </li>
                                );
                            }}
                            style={{ width: 240, margin: '10px' }}
                            renderInput={(params) => (
                                <TextField {...params} label="Tags" placeholder="Tags" />
                            )}
                        />
                        <Button
                            variant="contained"
                            sx={{margin: '10px'}}
                            onClick={async () => {
                                let response;
                                let data;
                                if (selectedIngredients.length === 0 && selectedCategories.length === 0 && selectedAreas.length === 0 && selectedTags.length === 0) {
                                    response = await fetch("/api/meals");
                                } else {
                                    response = await fetch(
                                        `/api/meals?ingredients=${selectedIngredients.join(",")}&category=${selectedCategories.join(",")}&area=${selectedAreas.join(",")}&tags=${selectedTags.join(",")}`
                                    );
                                }
                                data = await response.json();
                                setFilteredMeals(Array.isArray(data) ? data : []);
                            }}
                        >
                            Filter
                        </Button>
                    </Form>
                </Box>
            </Drawer>
            <Grid container spacing={1} marginTop={10}>
                {visibleMeals.map((meal, id) => (
                    <Grid key={id}>
                        <Card
                            sx={{width: 250, height: 300, cursor: "pointer"}}
                            key={id}
                            variant="outlined"
                            onClick={() => navigate(`/recipe/${id + 1}`)}
                            >
                            <CardActionArea onClick={() => navigate(`/recipe/${meal.id}`)}>
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
                            </CardActionArea>
                            <CardActions disableSpacing>
                                <IconButton aria-label="add to favorites">
                                    <FavoriteIcon/>
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
