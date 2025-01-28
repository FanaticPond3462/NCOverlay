export interface NextData {
    props: Props;
    page: string;
    query: Query;
    buildId: string;
    runtimeConfig: string;
    isFallback: boolean;
    customServer: boolean;
    gip: boolean;
    appGip: boolean;
    scriptLoader: any[];
}

export interface Props {
    isServer: boolean;
    initialState: InitialState;
    initialProps: InitialProps;
}

export interface InitialProps {
    pageProps: PageProps;
    locale: Locale;
    messages: { [key: string]: string };
}

export enum Locale {
    Ja = "ja",
}

export interface PageProps {
    videoId: string;
    videoType: string;
}

export interface InitialState {
    pickup: Pickup;
    feature: Feature;
    user: User;
    wallet: Wallet;
    me: Me;
    mainTabs: MainTabs;
    searchBar: SearchBar;
    videoDetail: VideoDetail;
    seriesDetail: SeriesDetail;
    liveDetail: LiveDetail;
    ipCheck: IPCheck;
    videoGrid: VideoGrid;
    links: Links;
    artistDetail: ArtistDetail;
    searchResults: SearchResults;
    searchNoResultRecommendation: SearchNoResultRecommendation;
    account: Account;
    eula: EULA;
    popup: Popup;
    iForce: IForce;
    specialItemGrid: SpecialItemGrid;
    player: Player;
    genreMain: Main;
    subgenreInfo: SubgenreInfo;
    openId: OpenID;
    payment: Payment;
    parameters: Parameters;
    rankingMain: Main;
}

export interface Account {
    isLoading: boolean;
    isEditMode: boolean;
    isError: boolean;
    activeTab: string;
    activeHtype: string;
    activeCardType: string;
    activeTabContent: Parameters;
    isShowAutoSkipController: boolean;
    defaultPlaybackRate: number;
    isLoadingDefaultPlaybackRate: boolean;
    isDefaultPlaybackRateFailure: boolean;
}

export interface Parameters {
}

export interface ArtistDetail {
    isLoading: boolean;
    isFavoriteLoading: boolean;
    artist: Parameters;
    favoriteStatus: null;
    relatedItems: null;
}

export interface EULA {
    content: null;
    hasError: boolean;
    isLoading: boolean;
}

export interface Feature {
    sections: any[];
    loading: boolean;
    error: boolean;
    rankingData: Parameters;
    sectionsToMutate: any[];
}

export interface Main {
    sections: any[];
    isLoading: boolean;
    hasError: boolean;
}

export interface IForce {
    msgId: null;
    message: null;
    linkUrl: null;
    iForceCookie: null;
    isShown: boolean;
}

export interface IPCheck {
    status: string;
}

export interface Links {
    currentOrigin: string;
    currentPath: string;
    currentUrl: string;
}

export interface LiveDetail {
    loading: boolean;
    live: null;
}

export interface MainTabs {
    activeTab: null;
    videoResult: null;
    isDataLoading: boolean;
    isListLoading: boolean;
    hasVideoError: boolean;
    genres: MainTabsGenre[];
    subGenreOptions: null;
    selectedSubGenreId: null;
    tabs: string[];
    rankings: Ranking[];
    hasRankings: boolean;
    mutateGenreRankingPathname: string;
    subGenreTabsData: null;
}

export interface MainTabsGenre {
    id: number;
    name: string;
    age_restriction: AgeRestriction;
    display_order: number;
    display_order_unlimited: number;
    display_order_ppv: number;
    default_ord: number;
    title: string;
    image_url: string;
    images: DarkImagesClass;
    title_images: TitleImages;
    dark_images: DarkImagesClass;
    dark_title_images: TitleImages;
}

export enum AgeRestriction {
    G = "G",
}

export interface DarkImagesClass {
    small: The2_Xlarge;
    medium: The2_Xlarge;
    large: The2_Xlarge;
    "2xlarge": The2_Xlarge;
}

export interface The2_Xlarge {
    url: string;
    width: number;
    height: number;
}

export interface TitleImages {
    small: The2_Xlarge;
    medium: The2_Xlarge;
}

export interface Ranking {
    content_type: string;
    title: string;
    content_url: string;
    id: string;
    pathname: string;
    menuListItem: string;
}

export interface Me {
    subscriptionInfo: any[];
    isUnlimitedPlan: boolean;
    unlimitedPlanStatus: null;
    isSmartPassPremium: boolean;
    smartPassPremiumStatus: null;
}

export interface OpenID {
    isError: boolean;
    isShowEdgeCasePopup: boolean;
    userInfo: Parameters;
    forgotPasswordInfo: Parameters;
    isForceLogout: boolean;
    debugTokenRefresh: Parameters;
}

export interface Payment {
    hasPaymentMethod: boolean;
    defaultPayMethod: Parameters;
}

export interface Pickup {
    sections: any[];
}

export interface Player {
    playback: Parameters;
    pemKey: string;
    playbackStatus: string;
}

export interface Popup {
    isActive: boolean;
    isBlocked: boolean;
    type: null;
    data: null;
}

export interface SearchBar {
    autoComplete: null;
    history: null;
    isActive: boolean;
    isFocus: boolean;
    isMobileShown: boolean;
}

export interface SearchNoResultRecommendation {
    isLoading: boolean;
    error: null;
    data: null;
    total: number;
}

export interface SearchResults {
    total: number;
    data: null;
    loading: boolean;
}

export interface SeriesDetail {
    loading: boolean;
    series: Series;
    isFavorite: boolean;
    isFavoriteLoading: boolean;
    nextPlayVideo: null;
    firstVideo: null;
    isRelatedLoading: boolean;
    isRelatedError: boolean;
    episodeSort: string;
    episodeIds: null;
    isKeepSort: boolean;
    isDefaultOrderDesc: boolean;
}

export interface Series {
    id: number;
    name: string;
    age_restriction: AgeRestriction;
    display_episode_count: number;
    deleted_at: null;
    season_sequence_number: number;
    season_display_title: string;
    series_display_title: string;
    combination_id: string;
    season_is_hidden: null;
    copyright: Copyright;
    bundle_id: number;
    series_start_at: number;
    series_end_at: number;
    synopses: Synopses;
    content_provider: ContentProvider;
    genres: SeriesGenre[];
    series_names: SeriesName[];
    episode_ids: number[];
    share_url: string;
    images: SeriesImages;
    watchas: null;
    tags: Tag[];
    series_promotion: null;
    related_videos: RelatedVideo[];
    seasons: Season[];
    on_shelf: boolean;
    official_site_url: null;
}

export enum ContentProvider {
    Kyban = "KYBAN",
}

export enum Copyright {
    C大森藤ノ・SBクリエイティブダンまち5製作委員会 = "(C)大森藤ノ・SBクリエイティブ/ダンまち5製作委員会",
}

export interface SeriesGenre {
    id: number;
    name: GenreName;
    default_ord?: number;
    parent_genre: ParentGenre[];
}

export enum GenreName {
    Sfファンタジー = "SF・ファンタジー",
    アクション = "アクション",
    オトメ = "オトメ",
    キッズTVシリーズ = "キッズTVシリーズ",
    キッズ映画・ショー = "キッズ映画・ショー",
    コメディ・ギャグ = "コメディ・ギャグ",
    スポーツ・青春 = "スポーツ・青春",
    ホラー・ミステリー = "ホラー・ミステリー",
    ラブストーリー・ラブコメ = "ラブストーリー・ラブコメ",
    ロボット = "ロボット",
    劇場版・長編 = "劇場版・長編",
    声優・ライブ = "声優・ライブ",
    美少女 = "美少女",
    見逃し = "見逃し",
}

export interface ParentGenre {
    id: number;
    name: ParentGenreName;
}

export enum ParentGenreName {
    アニメ = "アニメ",
    キッズ・特撮 = "キッズ・特撮",
    松岡禎丞ベル・クラネル = "松岡禎丞（ベル・クラネル）",
    水瀬いのりヘスティア = "水瀬いのり（ヘスティア）",
    石上静香シル・フローヴァ = "石上静香（シル・フローヴァ）",
}

export interface SeriesImages {
    small: The2_Xlarge;
    medium: The2_Xlarge;
    large: The2_Xlarge;
    "2xlarge": The2_Xlarge;
    "3xlarge": The2_Xlarge;
    "4xlarge": The2_Xlarge;
}

export interface RelatedVideo {
    relation: Relation;
    tab_name_jp: TabNameJp;
    tab_name_en: Relation;
    ids: any[];
}

export enum Relation {
    Extra = "extra",
    Original = "original",
    SpinOff = "spin-off",
}

export enum TabNameJp {
    オリジナル = "オリジナル",
    スピンオフ = "スピンオフ",
    番外編 = "番外編",
}

export interface Season {
    sequence_number: number;
    display_title: string;
    series_id: number;
    series_start_at: number;
    series_end_at: number;
}

export interface SeriesName {
    id: number;
    series_id: number;
    language_code: Locale;
    script_code: ScriptCode;
    name: string;
}

export enum ScriptCode {
    Hrkt = "Hrkt",
}

export interface Synopses {
    has_long: boolean;
    medium: string;
}

export enum Tag {
    CouponUsable = "coupon_usable",
    DashManifestHasHD = "dash_manifest_has_hd",
    DashTrailerManifestHasHD = "dash_trailer_manifest_has_hd",
    Downloadable = "downloadable",
    EndingSoon = "ending_soon",
    Free = "free",
    HDAndroid = "hd_android",
    HDChromecast = "hd_chromecast",
    HDIos = "hd_ios",
    HDMAC = "hd_mac",
    HDStb = "hd_stb",
    HDTablet = "hd_tablet",
    HDWindows = "hd_windows",
    HLSFPSManifestHasHD = "hls_fps_manifest_has_hd",
    HLSManifestHasHD = "hls_manifest_has_hd",
    HLSTrailerManifestHasHD = "hls_trailer_manifest_has_hd",
    MssManifestHasHD = "mss_manifest_has_hd",
    MssTrailerManifestHasHD = "mss_trailer_manifest_has_hd",
    New = "new",
    Original = "Original",
    PartialFree = "partial_free",
    PartialSpp = "partial_spp",
    Spp = "spp",
}

export interface SpecialItemGrid {
    isSpecialItemDetailLoading: boolean;
    title: string;
    specialItemDetail: Parameters;
}

export interface SubgenreInfo {
    isLoading: boolean;
    hasError: boolean;
    subgenreInfo: any[];
}

export interface User {
    lang: Locale;
    isLogin: boolean;
    isMobile: boolean;
    deviceId: string;
    ua: Ua;
    isSupportedBrowser: boolean;
    platform: string;
    allowHD: boolean;
    aut: string;
    act: string;
    forwardIP: string;
    isJWTToken: boolean;
}

export interface Ua {
    ua: string;
    browser: Browser;
    engine: Engine;
    os: Engine;
    device: Parameters;
    cpu: CPU;
}

export interface Browser {
    name: string;
    version: string;
    major: string;
}

export interface CPU {
    architecture: string;
}

export interface Engine {
    name: string;
    version: string;
}

export interface VideoDetail {
    loading: boolean;
    video: Video;
    keyButton: KeyButton;
    relatedItems: RelatedItem[];
    episodeIds: number[];
    activeTabIndex: number;
    isFavorite: boolean;
    isFavoriteLoading: boolean;
    isRelatedLoading: boolean;
    isRelatedError: boolean;
    episodeSort: string;
    isKeepSort: boolean;
    isDefaultOrderDesc: boolean;
}

export interface KeyButton {
    video_id: number;
    downloadable: boolean;
    has_been_played: null;
    button_type: string;
    button_licenses: ButtonLicense[];
    is_favorite: boolean;
    notify_me_when_ready: boolean;
    last_played_time_offset: null;
}

export interface ButtonLicense {
    license: string;
    info: Info;
}

export interface Info {
    id: number;
    price_id?: number;
    price_tax_included?: number;
    price_tax_excluded?: number;
    price_tax?: number;
    duration_in_hour?: number;
    publish_start_at: number;
    publish_end_at: number;
    public_start_at: number;
    public_end_at: number;
    coupon_usable?: boolean;
    expires_at?: number;
    subscription_plan_id?: number;
}

export interface RelatedItem {
    type: string;
    data: RelatedItemData;
}

export interface RelatedItemData {
    total?: number;
    perPage?: number;
    page?: number;
    items?: DataItem[];
    sections?: Section[];
}

export interface DataItem {
    type: ItemType;
    data: PurpleData;
}

export interface PurpleData {
    id: number;
    name: string;
    subtitle: string;
    age_restriction: AgeRestriction;
    copyright: Copyright;
    year_of_production: number;
    duration: number;
    opening_begin_time: number | null;
    opening_end_time: number | null;
    ending_begin_time: number | null;
    deleted_at: null;
    release_date: Date;
    short_display_title: string;
    title_id: number;
    filmarks: null;
    synopses: Synopses;
    genres: SeriesGenre[];
    artists: DataArtist[];
    content_provider: ContentProvider;
    content_provider_promotion: null;
    series_promotion: null;
    subscription_plans: SubscriptionPlans;
    prices: Prices;
    series_ids: number[];
    share_url: string;
    tags: Tag[];
    has_trailer: boolean;
    images: SeriesImages;
    in_blacklist: boolean;
    official_site_url: null;
    on_shelf: boolean;
}

export interface DataArtist {
    id: number;
    name: string;
    role: Role;
}

export enum Role {
    出演 = "出演",
    声の出演 = "声の出演",
    監督 = "監督",
    総監督 = "総監督",
}

export interface Prices {
    ppv: Ppv[];
}

export interface Ppv {
    id: number;
    prices_id: number;
    price_tax_included: number;
    price_tax_excluded: number;
    duration_in_hour: number;
    publish_start_at: number;
    publish_end_at: number;
    public_start_at: number;
    public_end_at: number;
    coupon_usable: boolean;
    downloadable: boolean;
}

export interface SubscriptionPlans {
    unlimited: Freemium[];
    spp?: Freemium[];
    ios_iap?: Freemium[];
    freemium?: Freemium[];
}

export interface Freemium {
    id: number;
    subscription_plan_id: number;
    publish_start_at: number;
    publish_end_at: number;
    public_start_at: number;
    public_end_at: number;
}

export enum ItemType {
    APISeries = "api.series",
    APIVideo = "api.video",
}

export interface Section {
    title: string;
    next: null | string;
    items: SectionItem[];
    type: SectionType;
}

export interface SectionItem {
    title: string;
    type: ItemType;
    id: number;
    image_url: null;
    data: FluffyData;
}

export interface FluffyData {
    id: number;
    name: string;
    subtitle?: null | string;
    age_restriction: AgeRestriction;
    copyright: null | string;
    year_of_production?: number;
    duration?: number;
    opening_begin_time?: number | null;
    opening_end_time?: number | null;
    ending_begin_time?: number | null;
    deleted_at: null;
    release_date?: null;
    short_display_title?: string;
    title_id?: number;
    filmarks?: null;
    synopses: Synopses;
    genres: SeriesGenre[];
    artists?: DataArtist[];
    content_provider: string;
    content_provider_promotion?: null;
    series_promotion: SeriesPromotion | null;
    subscription_plans?: SubscriptionPlans | null;
    prices?: Prices;
    series_ids?: any[];
    share_url: string;
    tags: Tag[];
    has_trailer?: boolean;
    images: SeriesImages;
    in_blacklist?: boolean;
    official_site_url: null;
    on_shelf: boolean;
    display_episode_count?: number;
    season_sequence_number?: number | null;
    season_display_title?: null | string;
    series_display_title?: null | string;
    combination_id?: null | string;
    season_is_hidden?: number | null;
    bundle_id?: number;
    series_start_at?: number;
    series_end_at?: number;
    series_names?: SeriesName[];
    episode_ids?: number[];
    watchas?: null;
    related_videos?: RelatedVideo[];
    seasons?: Season[];
}

export interface SeriesPromotion {
    link: string;
    text: string;
    images: SeriesPromotionImages;
}

export interface SeriesPromotionImages {
    "4xlarge": The2_Xlarge;
}

export enum SectionType {
    APICollection = "api.collection",
}

export interface Video {
    id: number;
    name: string;
    subtitle: string;
    age_restriction: AgeRestriction;
    copyright: Copyright;
    year_of_production: number;
    duration: number;
    opening_begin_time: number;
    opening_end_time: number;
    ending_begin_time: null;
    deleted_at: null;
    release_date: Date;
    short_display_title: string;
    title_id: number;
    filmarks: null;
    synopses: Synopses;
    genres: VideoGenre[];
    artists: VideoArtist[];
    content_provider: ContentProvider;
    content_provider_promotion: null;
    series_promotion: null;
    subscription_plans: SubscriptionPlans;
    prices: Prices;
    series_ids: number[];
    share_url: string;
    tags: Tag[];
    has_trailer: boolean;
    images: SeriesImages;
    in_blacklist: boolean;
    official_site_url: null;
    on_shelf: boolean;
    series_name: string;
}

export interface VideoArtist {
    role: Role;
    items: ParentGenre[];
}

export interface VideoGenre {
    id: number;
    name: string;
    parentId?: number;
}

export interface VideoGrid {
    loading: boolean;
    videos: Parameters;
    itemType: string;
    id: string;
    category: string;
    page: string;
    rankingItemError: boolean;
}

export interface Wallet {
    point: null;
    error: boolean;
}

export interface Query {
    videoType: string;
    id: string;
}
