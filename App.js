import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  YellowBox,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';
import Header from './src/header';
import {SwipeListView} from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import {SearchBar} from 'react-native-elements';
import {ConfirmDialog} from 'react-native-simple-dialogs';

console.disableYellowBox = true;
console.ignoredYellowBox = ['Warning: Each', 'Warning: Failed'];

const useDebounce = (value, delay) => {
  const [debounceValue, setDebounceValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounceValue;
};

const ToDoApp = () => {
  const [taskList, setTaskList] = React.useState('');
  const [data, setData] = React.useState([]);
  const [itemId, setItemId] = useState('');
  const [toggle, setToggle] = useState(true);
  const [query, setQuery] = useState('');
  const debounceQuery = useDebounce(query, 0);
  const [calcUndone, setUndone] = useState(0);
  const [retrievePermit, setRetrievePermit] = useState(true);
  // const cloneData = Object.values(data)
  //   .map(item => ({
  //     ...item,
  //     lowerCaseTask: item.taskList.toLowerCase(),
  //   }))
  //   .sort((a, b) => a.taskList > b.taskList);
  // const [filterList, setFilterList] = useState(cloneData);
  // const [typeCheck, setTypeCheck] = useState('');
  // const [check, setCheck] = useState('');

  useEffect(() => {
    if (retrievePermit) {
      setRetrievePermit(false);
      retrieveData();
    }
    taskCounter();
  }, [data]);

  useEffect(() => {
    textClear();
  });

  useEffect(() => {
    const lowerCaseQuery = debounceQuery.toLowerCase();
    if (data !== null) {
      const searchItem = data
        .filter(item => item.taskList.toLowerCase().includes(lowerCaseQuery))
        .map(item => ({
          ...item,
          rank: item.taskList.toLowerCase().indexOf(lowerCaseQuery),
        }))
        .sort((a, b) => a.rank - b.rank);

      setData(searchItem);
      // setFilterList(searchItem);
      if (!debounceQuery) {
        retrieveData();
      }
    }
  }, [debounceQuery]);

  const textClear = async () => {
    if (taskList !== null && taskList !== '') {
      if (query !== null && query !== '') {
        setQuery('');
      }
    }
  };

  const saveData = async () => {
    if (taskList !== null && taskList !== '') {
      let task = {
        taskList,
        isComplete: false,
        isImportant: false,
        key: Math.random(),
      };

      const arrTask = [task];
      const storedData = await AsyncStorage.getItem('task');
      const parseData = JSON.parse(storedData);
      setData(parseData);

      let newData = [];

      if (storedData === null) {
        // save
        await AsyncStorage.setItem('task', JSON.stringify(arrTask));
      } else {
        newData = [...parseData, task];
        await AsyncStorage.setItem('task', JSON.stringify(newData));
      }
      setTaskList('');
    }
    retrieveData();
  };

  const retrieveData = async () => {
    try {
      const valueString = await AsyncStorage.getItem('task');
      const value = JSON.parse(valueString);
      setData(value);
    } catch (error) {
      console.log('That did not go well.');
      throw error;
    }
  };

  const taskCounter = async () => {
    let size = data.filter(item => !item.isComplete).length;
    setUndone(size);
  };

  // delete data
  const clearData = async id => {
    if (query !== null && query !== '') {
      alert('Please kindly clear the the search filter before deleting.');
    } else {
      if (data !== null) {
        if (taskList === null || taskList === '') {
          const newData = data.filter((_, index) => index !== id);
          setData(newData);
          await AsyncStorage.setItem('task', JSON.stringify(newData));
        } else {
          alert(
            'You are currently in editing mode. You are not allowed to delete any data at the moment.',
          );
        }
      }
      retrieveData();
    }
  };

  const changeData = async (id, rowMap, rowKey) => {
    setToggle(false);
    closeRow(rowMap, rowKey);
    const changedData = data.map((item, index) => {
      if (index === id) {
        setTaskList(item.taskList);
      }
      return item;
    });

    setData(changedData);
    setItemId(id);
    await AsyncStorage.setItem('task', JSON.stringify(changedData));
    retrieveData();
  };

  // mark task as done
  const markTaskDone = async (id, rowMap, rowKey) => {
    closeRow(rowMap, rowKey);
    if (data[id].isComplete == false) {
      data[id].isComplete = true;
    } else {
      data[id].isComplete = false;
    }
    await AsyncStorage.setItem('task', JSON.stringify(data));
    retrieveData();
  };

  const markImportant = async (id, rowMap, rowKey) => {
    closeRow(rowMap, rowKey);
    if (data[id].isImportant == false) {
      data[id].isImportant = true;
    } else {
      data[id].isImportant = false;
    }
    await AsyncStorage.setItem('task', JSON.stringify(data));
    retrieveData();
  };

  // modify data
  const updateData = async () => {
    setToggle(true);
    data[itemId].taskList = taskList;
    await AsyncStorage.setItem('task', JSON.stringify(data));
    setTaskList('');
    Keyboard.dismiss();
    retrieveData();
  };

  const closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const renderItem = data => (
    <TouchableHighlight
      style={[
        data.item.isImportant && !data.item.isComplete
          ? styles.impRowFront
          : [data.item.isComplete ? styles.comRowFront : styles.defRowFront],
      ]}
      underlayColor={'#FFF'}
      onPress={() => {
        data.item.isImportant && !data.item.isComplete
          ? Alert.alert('Important Task', data.item.taskList)
          : [
              data.item.isComplete
                ? Alert.alert('Completed Task', data.item.taskList)
                : Alert.alert('Unfinished Task', data.item.taskList),
            ];
      }}>
      <View>
        <Text
          style={{
            textDecorationLine: data.item.isComplete ? 'line-through' : 'none',
            padding: 30,
            fontSize: 14,
            width: '100%',
          }}
          numberOfLines={1}>
          {data.item.taskList}
        </Text>
      </View>
    </TouchableHighlight>
  );

  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backLeftBtn, styles.backLeftBtnLeft]}
        onPress={() => {
          markTaskDone(data.index, rowMap, data.item.key);
        }}>
        <Icon name="check" size={20} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backLeftBtn, styles.backLeftBtnRight]}
        onPress={() => {
          markImportant(data.index, rowMap, data.item.key);
        }}>
        <Icon name="star" size={20} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnLeft]}
        onPress={() => changeData(data.index, rowMap, data.item.key)}>
        <Icon name="edit" size={20} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => {
          clearData(data.index);
        }}>
        <Icon name="remove" size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <SearchBar
        placeholder="Search..."
        onChangeText={setQuery}
        value={query}
        // onChange={e => {
        //   const test = data.filter(item => {
        //     return item.taskList.includes(e.target.value);
        //   });
        //   setData(test);
        //   // setQuery(e.target.value);
        // }}
        platform="default"
      />
      <TouchableOpacity style={{borderTopWidth: 1, borderTopColor: '#EEE'}}>
        <Text
          style={{
            fontSize: 20,
            right: 0,
            paddingLeft: 20,
            marginTop: 10,
            marginBottom: 10,
          }}>
          {calcUndone} unfinished task(s)
        </Text>
      </TouchableOpacity>

      <SwipeListView
        data={data}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={120}
        rightOpenValue={-120}
        style={{
          backgroundColor: '#FFF',
          marginBottom: 60,
        }}
      />

      <KeyboardAvoidingView
        style={styles.footer}
        behavior="margin"
        enabled={true}>
        <View style={styles.footerInner}>
          <TouchableOpacity
            style={styles.btn}
            onPress={toggle ? saveData : updateData}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={'Create new task...'}
            placeholderTextColor={'rgba(255, 255, 255, .7)'}
            value={taskList}
            onChangeText={text => setTaskList(text)}
            onSubmitEditing={toggle ? saveData : updateData}
            returnKeyLabel="done"
            returnKeyType="done"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  defRowFront: {
    backgroundColor: '#EEE',
    borderBottomColor: '#777',
    borderBottomWidth: 1,
    justifyContent: 'center',
    height: 50,
  },
  comRowFront: {
    backgroundColor: '#AAA',
    borderBottomColor: '#777',
    borderBottomWidth: 1,
    justifyContent: 'center',
    height: 50,
  },

  impRowFront: {
    backgroundColor: '#FCA',
    borderBottomColor: '#777',
    borderBottomWidth: 1,
    justifyContent: 'center',
    height: 50,
  },

  rowBack: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },

  row: {
    padding: 10,
    flexDirection: 'row',
  },

  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    top: 0,
    width: 60,
    justifyContent: 'center',
    position: 'absolute',
  },
  backRightBtnLeft: {
    backgroundColor: 'yellow',
    right: 60,
  },

  backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
  },

  backLeftBtn: {
    alignItems: 'center',
    bottom: 0,
    top: 0,
    width: 60,
    left: 0,
    justifyContent: 'center',
    position: 'absolute',
  },

  backLeftBtnLeft: {
    backgroundColor: 'green',
    left: 0,
  },

  backLeftBtnRight: {
    backgroundColor: 'teal',
    left: 60,
  },

  footer: {
    position: 'absolute',
    width: '100%',
    height: 60,
    bottom: 0,
    flex: 1,
  },

  footerInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    bottom: 0,
  },

  btn: {
    zIndex: 1,
    position: 'absolute',
    right: 20,
    top: 15,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#262526',
  },

  btnText: {
    color: '#fff',
    fontSize: 20,
  },

  textInput: {
    zIndex: 0,
    flex: 1,
    padding: 20,
    paddingRight: 75,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#262526',
  },

  end: {
    backgroundColor: '#123456',
  },
});

export default ToDoApp;
