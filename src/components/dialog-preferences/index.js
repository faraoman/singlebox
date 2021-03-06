import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import BuildIcon from '@material-ui/icons/Build';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import CodeIcon from '@material-ui/icons/Code';
import LanguageIcon from '@material-ui/icons/Language';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import NotificationsIcon from '@material-ui/icons/Notifications';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import RouterIcon from '@material-ui/icons/Router';
import SecurityIcon from '@material-ui/icons/Security';
import StorefrontIcon from '@material-ui/icons/Storefront';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import WidgetsIcon from '@material-ui/icons/Widgets';

import { TimePicker } from '@material-ui/pickers';

import connectComponent from '../../helpers/connect-component';

import StatedMenu from '../shared/stated-menu';

import { updateIsDefaultMailClient, updateIsDefaultWebBrowser } from '../../state/general/actions';

import webcatalogLogo from '../../images/webcatalog-logo.svg';
import translatiumLogo from '../../images/translatium-logo.svg';
import singleboxLogo from '../../images/singlebox-logo.svg';

import {
  requestCheckForUpdates,
  requestClearBrowsingData,
  requestOpenInBrowser,
  requestQuit,
  requestRealignActiveWorkspace,
  requestResetPreferences,
  requestSetPreference,
  requestSetSystemPreference,
  requestShowAboutWindow,
  requestShowCodeInjectionWindow,
  requestShowCustomUserAgentWindow,
  requestShowLicenseRegistrationWindow,
  requestShowNotificationsWindow,
  requestShowProxyWindow,
  requestShowRequireRestartDialog,
} from '../../senders';

const { remote } = window.require('electron');

const styles = (theme) => ({
  root: {
    padding: theme.spacing(2),
    background: theme.palette.background.default,
  },
  sectionTitle: {
    paddingLeft: theme.spacing(2),
  },
  paper: {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(3),
  },
  timePickerContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
  },
  secondaryEllipsis: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  sidebar: {
    position: 'fixed',
    width: 200,
    color: theme.palette.text.primary,
  },
  inner: {
    width: '100%',
    maxWidth: 500,
    float: 'right',
  },
  logo: {
    height: 28,
  },
});

const getThemeString = (theme) => {
  if (theme === 'light') return 'Light';
  if (theme === 'dark') return 'Dark';
  return 'System default';
};

const getOpenAtLoginString = (openAtLogin) => {
  if (openAtLogin === 'yes-hidden') return 'Yes, but minimized';
  if (openAtLogin === 'yes') return 'Yes';
  return 'No';
};

// language code extracted from https://github.com/electron/electron/releases/download/v8.0.0-beta.3/hunspell_dictionaries.zip
// languages name from http://www.lingoes.net/en/translator/langcode.htm & Chrome preferences
// sorted by name
const hunspellLanguagesMap = {
  'af-ZA': 'Afrikaans',
  sq: 'Albanian - shqip',
  hy: 'Armenian - հայերեն',
  'bg-BG': 'Bulgarian - български',
  'ca-ES': 'Catalan - català',
  'hr-HR': 'Croatian - hrvatski',
  'cs-CZ': 'Czech - čeština',
  'da-DK': 'Danish - dansk',
  'nl-NL': 'Dutch - Nederlands',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-GB': 'English (United Kingdom)',
  'en-US': 'English (United States)',
  'et-EE': 'Estonian - eesti',
  'fo-FO': 'Faroese - føroyskt',
  'fr-FR': 'French - français',
  'de-DE': 'German - Deutsch',
  'el-GR': 'Greek - Ελληνικά',
  'he-IL': 'Hebrew - ‎‫עברית‬‎',
  'hi-IN': 'Hindi - हिन्दी',
  'hu-HU': 'Hungarian - magyar',
  'id-ID': 'Indonesian - Indonesia',
  'it-IT': 'Italian - italiano',
  ko: 'Korean - 한국어',
  'lv-LV': 'Latvian - latviešu',
  'lt-LT': 'Lithuanian - lietuvių',
  'nb-NO': 'Norwegian Bokmål - norsk bokmål',
  'fa-IR': 'Persian - ‎‫فارسی‬‎',
  'pl-PL': 'Polish - polski',
  'pt-BR': 'Portuguese (Brazil) - português (Brasil)',
  'pt-PT': 'Portuguese (Portugal) - português (Portugal)',
  'ro-RO': 'Romanian - română',
  'ru-RU': 'Russian - русский',
  sr: 'Serbian - српски',
  sh: 'Serbo-Croatian - srpskohrvatski',
  'sk-SK': 'Slovak - slovenčina',
  'sl-SI': 'Slovenian - slovenščina',
  'es-ES': 'Spanish - español',
  'sv-SE': 'Swedish - svenska',
  'tg-TG': 'Tajik - тоҷикӣ',
  'ta-IN': 'Tamil - தமிழ்',
  'tr-TR': 'Turkish - Türkçe',
  'uk-UA': 'Ukrainian - українська',
  'vi-VN': 'Vietnamese - Tiếng Việt',
  'cy-GB': 'Welsh - Cymraeg',
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

const getUpdaterDesc = (status, info) => {
  if (status === 'download-progress') {
    if (info != null) {
      const { transferred, total, bytesPerSecond } = info;
      return `Downloading updates (${formatBytes(transferred)}/${formatBytes(total)} at ${formatBytes(bytesPerSecond)}/s)...`;
    }
    return 'Downloading updates...';
  }
  if (status === 'checking-for-update') {
    return 'Checking for updates...';
  }
  if (status === 'update-available') {
    return 'Downloading updates...';
  }
  if (status === 'update-downloaded') {
    if (info && info.version) return `A new version (${info.version}) has been downloaded.`;
    return 'A new version has been downloaded.';
  }
  return null;
};

const Preferences = ({
  allowPrerelease,
  askForDownloadPath,
  attachToMenubar,
  blockAds,
  classes,
  cssCodeInjection,
  customUserAgent,
  downloadPath,
  hibernateUnusedWorkspacesAtLaunch,
  hideMenuBar,
  isDefaultMailClient,
  isDefaultWebBrowser,
  jsCodeInjection,
  navigationBar,
  onUpdateIsDefaultMailClient,
  onUpdateIsDefaultWebBrowser,
  openAtLogin,
  pauseNotificationsBySchedule,
  pauseNotificationsByScheduleFrom,
  pauseNotificationsByScheduleTo,
  pauseNotificationsMuteAudio,
  registered,
  rememberLastPageVisited,
  shareWorkspaceBrowsingData,
  sidebar,
  spellChecker,
  spellCheckerLanguages,
  swipeToNavigate,
  theme,
  titleBar,
  unreadCountBadge,
  updaterInfo,
  updaterStatus,
}) => {
  const sections = {
    general: {
      text: 'General',
      Icon: WidgetsIcon,
      ref: useRef(),
    },
    notifications: {
      text: 'Notifications',
      Icon: NotificationsIcon,
      ref: useRef(),
    },
    languages: {
      text: 'Languages',
      Icon: LanguageIcon,
      ref: useRef(),
    },
    downloads: {
      text: 'Downloads',
      Icon: CloudDownloadIcon,
      ref: useRef(),
    },
    network: {
      text: 'Network',
      Icon: RouterIcon,
      ref: useRef(),
    },
    privacy: {
      text: 'Privacy & Security',
      Icon: SecurityIcon,
      ref: useRef(),
    },
    system: {
      text: 'System',
      Icon: BuildIcon,
      ref: useRef(),
    },
    updates: {
      text: 'Updates',
      Icon: SystemUpdateAltIcon,
      ref: useRef(),
    },
    advanced: {
      text: 'Advanced',
      Icon: CodeIcon,
      ref: useRef(),
    },
    reset: {
      text: 'Reset',
      Icon: RotateLeftIcon,
      ref: useRef(),
    },
    atomeryApps: {
      text: 'Atomery Apps',
      Icon: StorefrontIcon,
      ref: useRef(),
    },
    miscs: {
      text: 'Miscellaneous',
      Icon: MoreHorizIcon,
      ref: useRef(),
    },
  };

  useEffect(() => {
    const scrollTo = window.require('electron').remote.getGlobal('preferencesScrollTo');
    if (!scrollTo) return;
    sections[scrollTo].ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  return (
    <div className={classes.root}>
      <div className={classes.sidebar}>
        <List dense>
          {Object.keys(sections).map((sectionKey, i) => {
            const {
              Icon, text, ref, hidden,
            } = sections[sectionKey];
            if (hidden) return null;
            return (
              <React.Fragment key={sectionKey}>
                {i > 0 && <Divider />}
                <ListItem button onClick={() => ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </div>
      <div className={classes.inner}>
        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.general.ref}>
          General
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <StatedMenu
              id="theme"
              buttonElement={(
                <ListItem button>
                  <ListItemText primary="Theme" secondary={getThemeString(theme)} />
                  <ChevronRightIcon color="action" />
                </ListItem>
              )}
            >
              <MenuItem dense onClick={() => requestSetPreference('theme', 'automatic')}>System default</MenuItem>
              <MenuItem dense onClick={() => requestSetPreference('theme', 'light')}>Light</MenuItem>
              <MenuItem dense onClick={() => requestSetPreference('theme', 'dark')}>Dark</MenuItem>
            </StatedMenu>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Show sidebar"
                secondary="Sidebar lets you switch easily between workspaces."
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={sidebar}
                  onChange={(e) => {
                    requestSetPreference('sidebar', e.target.checked);
                    requestRealignActiveWorkspace();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Show navigation bar"
                secondary="Navigation bar lets you go back, forward, home and reload."
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  // must show sidebar or navigation bar on Linux
                  // if not, as user can't right-click on menu bar icon
                  // they can't access preferences or notifications
                  checked={(window.process.platform === 'linux' && attachToMenubar && !sidebar) || navigationBar}
                  disabled={(window.process.platform === 'linux' && attachToMenubar && !sidebar)}
                  onChange={(e) => {
                    requestSetPreference('navigationBar', e.target.checked);
                    requestRealignActiveWorkspace();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {window.process.platform === 'darwin' && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Show title bar"
                    secondary="Title bar shows you the title of the current page."
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      color="primary"
                      checked={!attachToMenubar && !sidebar && !navigationBar ? true : titleBar}
                      disabled={!attachToMenubar && !sidebar && !navigationBar}
                      onChange={(e) => {
                        requestSetPreference('titleBar', e.target.checked);
                        requestRealignActiveWorkspace();
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </>
            )}
            {window.process.platform !== 'darwin' && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Hide menu bar"
                    secondary="Hide the menu bar unless the Alt key is pressed."
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      color="primary"
                      checked={hideMenuBar}
                      onChange={(e) => {
                        requestSetPreference('hideMenuBar', e.target.checked);
                        requestShowRequireRestartDialog();
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </>
            )}
            <Divider />
            <ListItem>
              <ListItemText
                primary={window.process.platform === 'win32'
                  ? 'Attach to taskbar' : 'Attach to menu bar'}
                secondary={window.process.platform !== 'linux' ? 'Tip: Right-click on app icon to access context menu.' : null}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={attachToMenubar}
                  onChange={(e) => {
                    requestSetPreference('attachToMenubar', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {window.process.platform === 'darwin' && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Swipe to navigate"
                    secondary={(
                      <>
                        <span>Navigate between pages with 3-finger gestures.</span>
                        <br />
                        <span>To enable it, you also need to change </span>
                        <b>
                          macOS Preferences &gt; Trackpad &gt; More Gestures &gt; Swipe between page
                        </b>
                        <span> to </span>
                        <b>Swipe with three fingers</b>
                        <span> or </span>
                        <b>Swipe with two or three fingers.</b>
                      </>
                    )}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      color="primary"
                      checked={swipeToNavigate}
                      onChange={(e) => {
                        requestSetPreference('swipeToNavigate', e.target.checked);
                        requestShowRequireRestartDialog();
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </>
            )}
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.notifications.ref}>
          Notifications
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem button onClick={requestShowNotificationsWindow}>
              <ListItemText primary="Control notifications" />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText>
                Automatically disable notifications by schedule:
                <div className={classes.timePickerContainer}>
                  <TimePicker
                    autoOk={false}
                    label="from"
                    value={new Date(pauseNotificationsByScheduleFrom)}
                    onChange={(d) => requestSetPreference('pauseNotificationsByScheduleFrom', d.toString())}
                    disabled={!pauseNotificationsBySchedule}
                  />
                  <TimePicker
                    autoOk={false}
                    label="to"
                    value={new Date(pauseNotificationsByScheduleTo)}
                    onChange={(d) => requestSetPreference('pauseNotificationsByScheduleTo', d.toString())}
                    disabled={!pauseNotificationsBySchedule}
                  />
                </div>
                (
                {window.Intl.DateTimeFormat().resolvedOptions().timeZone}
                )
              </ListItemText>
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={pauseNotificationsBySchedule}
                  onChange={(e) => {
                    requestSetPreference('pauseNotificationsBySchedule', e.target.checked);
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Mute audio when notifications are paused" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={pauseNotificationsMuteAudio}
                  onChange={(e) => {
                    requestSetPreference('pauseNotificationsMuteAudio', e.target.checked);
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {window.process.platform === 'darwin' && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText primary="Show unread count badge" />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      color="primary"
                      checked={unreadCountBadge}
                      onChange={(e) => {
                        requestSetPreference('unreadCountBadge', e.target.checked);
                        requestShowRequireRestartDialog();
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </>
            )}
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.languages.ref}>
          Languages
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem>
              <ListItemText primary="Spell check" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={spellChecker}
                  onChange={(e) => {
                    requestSetPreference('spellChecker', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <StatedMenu
              id="spellcheckerLanguages"
              buttonElement={(
                <ListItem button>
                  <ListItemText
                    primary="Spell checking language"
                    secondary={spellCheckerLanguages.map((code) => hunspellLanguagesMap[code]).join(' | ')}
                  />
                  <ChevronRightIcon color="action" />
                </ListItem>
              )}
            >
              {Object.keys(hunspellLanguagesMap).map((code) => (
                <MenuItem
                  dense
                  key={code}
                  onClick={() => {
                    requestSetPreference('spellCheckerLanguages', [code]);
                    requestShowRequireRestartDialog();
                  }}
                >
                  {hunspellLanguagesMap[code]}
                </MenuItem>
              ))}
            </StatedMenu>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.downloads.ref}>
          Downloads
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem
              button
              onClick={() => {
                remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                  properties: ['openDirectory'],
                }).then((result) => {
                  if (!result.canceled && result.filePaths) {
                    requestSetPreference('downloadPath', result.filePaths[0]);
                  }
                }).catch((err) => {
                  console.log(err); // eslint-disable-line no-console
                });
              }}
            >
              <ListItemText
                primary="Download Location"
                secondary={downloadPath}
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Ask where to save each file before downloading" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={askForDownloadPath}
                  onChange={(e) => {
                    requestSetPreference('askForDownloadPath', e.target.checked);
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" color="textPrimary" className={classes.sectionTitle} ref={sections.network.ref}>
          Network
        </Typography>
        <Paper className={classes.paper}>
          <List disablePadding dense>
            <ListItem button onClick={requestShowProxyWindow}>
              <ListItemText primary="Configure proxy settings (BETA)" />
              <ChevronRightIcon color="action" />
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.privacy.ref}>
          Privacy &amp; Security
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem>
              <ListItemText primary="Block ads &amp; trackers" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={blockAds}
                  onChange={(e) => {
                    requestSetPreference('blockAds', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Remember last page visited" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={rememberLastPageVisited}
                  onChange={(e) => {
                    requestSetPreference('rememberLastPageVisited', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Share browsing data between workspaces" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={shareWorkspaceBrowsingData}
                  onChange={(e) => {
                    requestSetPreference('shareWorkspaceBrowsingData', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem button onClick={requestClearBrowsingData}>
              <ListItemText primary="Clear browsing data" secondary="Clear cookies, cache, and more" />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => requestOpenInBrowser('https://singleboxapp.com/privacy')}>
              <ListItemText primary="Privacy Policy" />
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.system.ref}>
          System
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            {isDefaultMailClient ? (
              <ListItem>
                <ListItemText secondary="Singlebox is your default email client." />
              </ListItem>
            ) : (
              <ListItem>
                <ListItemText primary="Default email client" secondary="Make Singlebox the default email client." />
                <Button
                  variant="outlined"
                  size="small"
                  color="default"
                  className={classes.button}
                  onClick={() => {
                    remote.app.setAsDefaultProtocolClient('mailto');
                    onUpdateIsDefaultMailClient(remote.app.isDefaultProtocolClient('mailto'));
                  }}
                >
                  Make default
                </Button>
              </ListItem>
            )}
            <Divider />
            {isDefaultWebBrowser ? (
              <ListItem>
                <ListItemText secondary="Singlebox is your default web browser." />
              </ListItem>
            ) : (
              <ListItem>
                <ListItemText primary="Default web browser" secondary="Make Singlebox the default web browser." />
                <Button
                  variant="outlined"
                  size="small"
                  color="default"
                  className={classes.button}
                  onClick={() => {
                    remote.app.setAsDefaultProtocolClient('http');
                    remote.app.setAsDefaultProtocolClient('https');
                    onUpdateIsDefaultWebBrowser(remote.app.isDefaultProtocolClient('http'));
                  }}
                >
                  Make default
                </Button>
              </ListItem>
            )}
            <Divider />
            <StatedMenu
              id="openAtLogin"
              buttonElement={(
                <ListItem button>
                  <ListItemText primary="Open at login" secondary={getOpenAtLoginString(openAtLogin)} />
                  <ChevronRightIcon color="action" />
                </ListItem>
              )}
            >
              <MenuItem dense onClick={() => requestSetSystemPreference('openAtLogin', 'yes')}>Yes</MenuItem>
              <MenuItem dense onClick={() => requestSetSystemPreference('openAtLogin', 'yes-hidden')}>Yes, but minimized</MenuItem>
              <MenuItem dense onClick={() => requestSetSystemPreference('openAtLogin', 'no')}>No</MenuItem>
            </StatedMenu>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.updates.ref}>
          Updates
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem
              button
              onClick={() => requestCheckForUpdates(false)}
              disabled={updaterStatus === 'checking-for-update'
                || updaterStatus === 'download-progress'
                || updaterStatus === 'download-progress'
                || updaterStatus === 'update-available'}
            >
              <ListItemText
                primary={updaterStatus === 'update-downloaded' ? 'Restart to Apply Updates' : 'Check for Updates'}
                secondary={getUpdaterDesc(updaterStatus, updaterInfo)}
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Receive pre-release updates"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={allowPrerelease}
                  onChange={(e) => {
                    requestSetPreference('allowPrerelease', e.target.checked);
                    requestShowRequireRestartDialog();
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.advanced.ref}>
          Advanced
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem>
              <ListItemText
                primary="Hibernate unused workspaces at app launch"
                secondary="Hibernate all workspaces at launch, except the last active workspace."
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={hibernateUnusedWorkspacesAtLaunch}
                  onChange={(e) => {
                    requestSetPreference('hibernateUnusedWorkspacesAtLaunch', e.target.checked);
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem button onClick={requestShowCustomUserAgentWindow}>
              <ListItemText
                primary="Custom User Agent"
                secondary={customUserAgent || 'Not set'}
                classes={{ secondary: classes.secondaryEllipsis }}
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => requestShowCodeInjectionWindow('js')}>
              <ListItemText primary="JS Code Injection" secondary={jsCodeInjection ? 'Set' : 'Not set'} />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => requestShowCodeInjectionWindow('css')}>
              <ListItemText primary="CSS Code Injection" secondary={cssCodeInjection ? 'Set' : 'Not set'} />
              <ChevronRightIcon color="action" />
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.reset.ref}>
          Reset
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem button onClick={requestResetPreferences}>
              <ListItemText primary="Restore preferences to their original defaults" />
              <ChevronRightIcon color="action" />
            </ListItem>
          </List>
        </Paper>

        <Typography variant="subtitle2" color="textPrimary" className={classes.sectionTitle} ref={sections.atomeryApps.ref}>
          Atomery Apps
        </Typography>
        <Paper className={classes.paper}>
          <List disablePadding dense>
            <ListItem button onClick={() => requestOpenInBrowser('https://webcatalogapp.com?utm_source=webcatalog_app')}>
              <ListItemText
                primary={(<img src={webcatalogLogo} alt="WebCatalog" className={classes.logo} />)}
                secondary="Run Web Apps like Real Apps"
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => requestOpenInBrowser('https://singleboxapp.com?utm_source=webcatalog_app')}>
              <ListItemText
                primary={(<img src={singleboxLogo} alt="Singlebox" className={classes.logo} />)}
                secondary="All Your Apps in One Single Window"
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => requestOpenInBrowser('https://translatiumapp.com?utm_source=webcatalog_app')}>
              <ListItemText
                primary={(<img src={translatiumLogo} alt="Translatium" className={classes.logo} />)}
                secondary="Translate Any Languages like a Pro"
              />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
          </List>
        </Paper>

        <Typography variant="subtitle2" className={classes.sectionTitle} ref={sections.miscs.ref}>
          Miscellaneous
        </Typography>
        <Paper className={classes.paper}>
          <List dense disablePadding>
            <ListItem button onClick={requestShowAboutWindow}>
              <ListItemText primary="About" />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={requestShowLicenseRegistrationWindow} disabled={registered}>
              <ListItemText primary="License Registration" secondary={registered ? 'Registered. Thank you for supporting the development of Singlebox.' : null} />
              <ChevronRightIcon color="action" />
            </ListItem>
            <Divider />
            <ListItem button onClick={requestQuit}>
              <ListItemText primary="Quit" />
              <ChevronRightIcon color="action" />
            </ListItem>
          </List>
        </Paper>
      </div>
    </div>
  );
};

Preferences.defaultProps = {
  cssCodeInjection: null,
  customUserAgent: null,
  jsCodeInjection: null,
  updaterInfo: null,
  updaterStatus: null,
};

Preferences.propTypes = {
  allowPrerelease: PropTypes.bool.isRequired,
  askForDownloadPath: PropTypes.bool.isRequired,
  attachToMenubar: PropTypes.bool.isRequired,
  blockAds: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  cssCodeInjection: PropTypes.string,
  customUserAgent: PropTypes.string,
  downloadPath: PropTypes.string.isRequired,
  hibernateUnusedWorkspacesAtLaunch: PropTypes.bool.isRequired,
  hideMenuBar: PropTypes.bool.isRequired,
  isDefaultMailClient: PropTypes.bool.isRequired,
  isDefaultWebBrowser: PropTypes.bool.isRequired,
  jsCodeInjection: PropTypes.string,
  navigationBar: PropTypes.bool.isRequired,
  onUpdateIsDefaultMailClient: PropTypes.func.isRequired,
  onUpdateIsDefaultWebBrowser: PropTypes.func.isRequired,
  openAtLogin: PropTypes.oneOf(['yes', 'yes-hidden', 'no']).isRequired,
  pauseNotificationsBySchedule: PropTypes.bool.isRequired,
  pauseNotificationsByScheduleFrom: PropTypes.string.isRequired,
  pauseNotificationsByScheduleTo: PropTypes.string.isRequired,
  pauseNotificationsMuteAudio: PropTypes.bool.isRequired,
  registered: PropTypes.bool.isRequired,
  rememberLastPageVisited: PropTypes.bool.isRequired,
  shareWorkspaceBrowsingData: PropTypes.bool.isRequired,
  sidebar: PropTypes.bool.isRequired,
  spellChecker: PropTypes.bool.isRequired,
  spellCheckerLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  swipeToNavigate: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  titleBar: PropTypes.bool.isRequired,
  unreadCountBadge: PropTypes.bool.isRequired,
  updaterInfo: PropTypes.object,
  updaterStatus: PropTypes.string,
};

const mapStateToProps = (state) => ({
  allowPrerelease: state.preferences.allowPrerelease,
  askForDownloadPath: state.preferences.askForDownloadPath,
  attachToMenubar: state.preferences.attachToMenubar,
  blockAds: state.preferences.blockAds,
  cssCodeInjection: state.preferences.cssCodeInjection,
  customUserAgent: state.preferences.customUserAgent,
  downloadPath: state.preferences.downloadPath,
  hibernateUnusedWorkspacesAtLaunch: state.preferences.hibernateUnusedWorkspacesAtLaunch,
  hideMenuBar: state.preferences.hideMenuBar,
  isDefaultMailClient: state.general.isDefaultMailClient,
  isDefaultWebBrowser: state.general.isDefaultWebBrowser,
  jsCodeInjection: state.preferences.jsCodeInjection,
  navigationBar: state.preferences.navigationBar,
  openAtLogin: state.systemPreferences.openAtLogin,
  pauseNotificationsBySchedule: state.preferences.pauseNotificationsBySchedule,
  pauseNotificationsByScheduleFrom: state.preferences.pauseNotificationsByScheduleFrom,
  pauseNotificationsByScheduleTo: state.preferences.pauseNotificationsByScheduleTo,
  pauseNotificationsMuteAudio: state.preferences.pauseNotificationsMuteAudio,
  registered: state.preferences.registered,
  rememberLastPageVisited: state.preferences.rememberLastPageVisited,
  shareWorkspaceBrowsingData: state.preferences.shareWorkspaceBrowsingData,
  sidebar: state.preferences.sidebar,
  spellChecker: state.preferences.spellChecker,
  spellCheckerLanguages: state.preferences.spellCheckerLanguages,
  swipeToNavigate: state.preferences.swipeToNavigate,
  theme: state.preferences.theme,
  titleBar: state.preferences.titleBar,
  unreadCountBadge: state.preferences.unreadCountBadge,
  updaterInfo: state.updater.info,
  updaterStatus: state.updater.status,
});

const actionCreators = {
  updateIsDefaultMailClient,
  updateIsDefaultWebBrowser,
};

export default connectComponent(
  Preferences,
  mapStateToProps,
  actionCreators,
  styles,
);
