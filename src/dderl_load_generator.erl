-module(dderl_load_generator).

-behaviour(gen_server).

-include("dderl.hrl").

-export([start/0,
         start/4,
         get_tables/0,
         stop/0]).

% gen_server behavior callbacks

-export([init/1,
         handle_call/3,
         handle_cast/2,
         handle_info/2,
         terminate/2,
         code_change/3]).

%% Default 10 tables with 10 columns and 100k rows.
-define(NTABLES, 10).
-define(NROWS, 100000).
-define(NCOLUMNS, 10).
%% Default delay between inserts of 100 ms.
-define(INS_DELAY, 100).

-record(state, {n_tables = ?NTABLES,
                n_rows = ?NROWS,
                n_columns = ?NCOLUMNS,
                ins_delay = ?INS_DELAY,
                tables = []}).

-spec start() -> ok | already_started | {error, term()}.
start() ->
    start(?NTABLES, ?NROWS, ?NCOLUMNS, ?INS_DELAY).

-spec start(integer(), integer(), integer(), integer()) -> ok | already_started | {error, term()}.
start(NTables, NRows, NColumns, InsDelay) ->
    InitState = #state{n_tables = NTables,
                       n_rows = NRows,
                       n_columns = NColumns,
                       ins_delay = InsDelay},
    case gen_server:start({local, ?MODULE}, ?MODULE, InitState, []) of
        {ok, _Pid} -> ok;
        {error, {already_started, _Pid}} -> already_started;
        Error -> Error
    end.

-spec get_tables() -> [atom()].
get_tables() ->
    gen_server:call(?MODULE, get_tables).

-spec stop() -> ok.
stop() ->
    gen_server:call(?MODULE, stop).

%% Gen server callbacks

init(#state{n_tables = NTables,
            n_rows = NRows,
            n_columns = NColumns,
            ins_delay = InsDelay} = State) ->
    Tables = create_names("temp@", NTables),
    TablesPid = [{spawn_link(
                    fun() ->
                            start_worker(TableName, NRows, NColumns, InsDelay)
                    end
                   ), TableName} || TableName <- Tables],
    {ok, State#state{tables = TablesPid}}.

handle_call(get_tables, _From, #state{tables = Tables} = State) ->
    {reply, Tables, State};
handle_call(stop, _From, State) ->
    {stop, shutdown, ok, State}.

handle_cast(_Ignored, State) ->
    ?Error("received unknown cast ~p in load_generator when state: ~n~p", [_Ignored, State]),
    {noreply, State}.

handle_info(_Info, State) ->
	{noreply, State}.

terminate(_Reason, _State) -> ok.

code_change(_OldVsn, State, _Extra) -> {ok, State}.

%% Helper functions
-spec create_names(string(), pos_integer()) -> [atom()].
create_names(Prefix, TotalNames) ->
    create_names(Prefix, TotalNames, 1).

-spec create_names(string(), pos_integer(), pos_integer()) -> [atom()].
create_names(_Prefix, TotalNames, NCurrent) when NCurrent > TotalNames -> [];
create_names(Prefix, TotalNames, NCurrent) when NCurrent =< TotalNames ->
    [list_to_atom(Prefix ++ [96 + NCurrent]) | create_names(Prefix, TotalNames, NCurrent + 1)].

-spec start_worker(atom(), pos_integer(), pos_integer(), pos_integer()) -> ok.
start_worker(TableName, NRows, NColumns, InsDelay) ->
    rand:seed(exsplus, os:timestamp()),
    %% Only basic types for now...
    ColumnTypes = create_random_types(NColumns),
    Defaults = create_row(TableName, ColumnTypes, default_fun()),
    ColumnNames = create_names("column", NColumns),
    imem_meta:create_table(TableName, {ColumnNames, ColumnTypes, Defaults}, []),
    add_data(TableName, NRows, ColumnTypes, InsDelay, 1).

-spec add_data(atom(), pos_integer(), [atom()], pos_integer(), pos_integer()) -> ok.
add_data(TableName, NRows, ColumnTypes, InsDelay, NCurrent) when NCurrent =< NRows->
    CurrentRow = create_row(TableName, ColumnTypes, random_fun()),
    imem_meta:write(TableName, CurrentRow),
    timer:sleep(InsDelay),
    add_data(TableName, NRows, ColumnTypes, InsDelay, NCurrent + 1);
add_data(_TableName, _NRows, _ColumnTypes, _InsDelay, _NCurrent) ->
    ok.

-spec create_random_types(pos_integer()) -> [atom()].
create_random_types(NTypes) ->
    AllowedTypes = [integer, float, tuple, binary, list],
    [lists:nth(rand:uniform(length(AllowedTypes)), AllowedTypes) ||
        _ <- lists:seq(1, NTypes)].

-spec create_row(atom(), [atom()], fun()) -> tuple().
create_row(TableName, ColumnTypes, TypeFun) ->
    list_to_tuple([TableName | [TypeFun(Type) || Type <- ColumnTypes]]).

-spec default_fun() -> fun().
default_fun() ->
    fun(Type) ->
        default(Type)
    end.

-spec default(atom()) -> term().
default(integer) -> 0;
default(float) -> 0.0;
default(tuple) -> {};
default(binary) -> <<>>;
default(list) -> [].

-spec random_fun() -> fun().
random_fun() ->
    fun(Type) ->
        random(Type)
    end.

-spec random(atom()) -> term().
random(integer) ->
    <<Value:8/unit:8>> = crypto:strong_rand_bytes(8),
    Value;
random(float) ->
    rand:uniform();
random(tuple) ->
    list_to_tuple(random(list));
random(binary) ->
    Size = 7 + rand:uniform(52),  % replacement for crypto:rand_uniform(8, 60)
    if
        Size < 54 ->
            crypto:strong_rand_bytes(Size);
        Size < 58 ->
            crypto:strong_rand_bytes(1024);
        true ->
            crypto:strong_rand_bytes(4096)
    end;
random(list) ->
    Size = rand:uniform(10),
    [random(integer) || _ <- lists:seq(1, Size)].
