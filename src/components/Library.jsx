import React, { useState, useEffect, useContext, useRef } from 'react';
import WarnningIcon from '@material-ui/icons/Warning'
import FlipMove from 'react-flip-move';
import { queryContext } from '../contexts/QueryContext'
import { makeStyles } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import FileDrop from 'react-file-drop';
import AddIcon from "@material-ui/icons/Add"
import DeleteIcon from "@material-ui/icons/Delete"
var GifPlayer = require('react-gif-player')

const _calPercent = ({ percent, state }) => {
  return (state !== 'predict' ? percent * 100 / 2 : 50 + percent * 100 / 2).toFixed(2)
}
const regex = new RegExp(/\.gif$/i)
const Libarary = () => {
  const { queryLibrary, navTitle, setNavTitle, upload, queryStatus, delVideo } = useContext(queryContext);
  const isMobile = !useMediaQuery("(min-width:1000px)");
  const [results, setResults] = useState([]);
  const [selectedID, setSelectedID] = useState('');
  const [loadingPercent, setLoadingPercent] = useState(0)
  const [uploadQueue, setUploadQueue] = useState([]);

  const useStyles = makeStyles({
    root: {
      flexGrow: 1,
      overflowX: "hidden",
      overflowY: "auto",
      padding: isMobile ? "10px" : "20px",
      display: "flex",
      flexDirection: "column",
    },
    container: {
      width: '100%',
      columnCount: 6,
      columnGap: '3px',
      position: 'relative',
    },
    noResContainer: {
      width: '17%',
    },
    imgWrapper: {
      width: '100%',
      minHeight: '40px',
      display: 'block',
      position: 'relative',
      border: 'solid 1px transparent',
    },
    cover: {
      position: 'absolute',
      top: 0, right: 0, width: `${100 - loadingPercent}%`, height: '100%',
      backgroundColor: 'rgba(79,196,249,0.5)',
    },
    percent: {
      position: 'absolute',
      bottom: '5px', right: '5px',
      color: '#fff',
      textShadow: `black 0.1em 0.1em 0.2em`
    },
    selected: {
      border: 'solid 1px red'
    },
    delete: {
      color: '#fff',
      background: 'red',
      cursor: 'pointer'
    },
    addWrapper: {
      width: "100%",
      marginBottom: results.length ?'3px':'20px',
      height: '15vh',
      background: 'rgba(255,255,255,0.1)',
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      border: '1px solid rgba(176,176,185,1)',
      color: '#fff',
      cursor: 'pointer'
    },
  });
  const classes = useStyles({});
  const uploader = useRef(null);
  const FileUploader = useRef(null);
  const uploaderID = useRef(null);
  const GifUploading = useRef("");
  const TotalContainer = useRef(0);
  const isSubscription = useRef(true);

  const onMouseOver = (id) => setSelectedID(id)
  const onMouseLeave = (id) => selectedID === id && setSelectedID("")
  const deleteGif = (name) => {
    setResults(results.filter(result => result.name !== name))
    delVideo(name).then(res => {
      if (res && res.status === 200 && isSubscription.current) {
        TotalContainer.current = TotalContainer.current - 1;
        setNavTitle(`${TotalContainer.current} VIDEOS IN LIBRARY`)
      }
    })
  }
  const clickUpload = () => {
    if (FileUploader.current) {
      FileUploader.current.onchange = (e) => {
        const files = [...e.target.files].filter(item => regex.test(item.name));
        setUploadQueue(files);
      }
      FileUploader.current.click();
    }
  }

  useEffect(() => {
    isSubscription.current = true;
    const query = async () => {
      queryLibrary().then(res => {
        if (res && res.status === 200) {
          const { Data, Total } = res.data;
          setResults(Data)
          TotalContainer.current = Total;
          setNavTitle(`${Total} VIDEOS IN LIBRARY`)
        }
      })
    }
    query()
    return () => {
      isSubscription.current = false;
    }
    //eslint-disable-next-line
  }, [])

  useEffect(() => {
    isSubscription.current = true;
    const _upload = async e => {
      const files = [...e.dataTransfer.files].filter(item => regex.test(item.name));
      if (files && files.length > 0 && isSubscription.current) {
        setUploadQueue(files)
      }
    }
    const Uploader = uploader.current || document.createElement('div');
    const _onMouseEnter = e => {
      if (uploader.current) {
        uploader.current.classList.add('drag-enter')
      }
    }
    const _onMouseLeave = e => {
      if (uploader.current) {
        uploader.current.classList.remove('drag-enter');
      }
    }
    document.body.addEventListener('drop', _upload);
    document.body.addEventListener('dragenter', _onMouseEnter);
    document.body.addEventListener('dragleave', _onMouseLeave);
    Uploader.addEventListener('mouseenter', _onMouseEnter);
    Uploader.addEventListener('mouseleave', _onMouseLeave);
    return () => {
      document.body.removeEventListener('drop', _upload);
      document.body.removeEventListener('dragenter', _onMouseEnter);
      document.body.removeEventListener('dragleave', _onMouseLeave);
      Uploader.addEventListener('mouseenter', _onMouseEnter);
      Uploader.addEventListener('mouseleave', _onMouseLeave);
      isSubscription.current = false;
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, setResults])
  useEffect(() => {
    isSubscription.current = true;
    let timeout;
    const _finishOneUpload = () => {
      TotalContainer.current = TotalContainer.current + 1;
      setNavTitle(`${TotalContainer.current} VIDEOS IN LIBRARY`)
      setResults(results => [{ name: uploaderID.current, data: GifUploading.current }, ...results])
      setUploadQueue(uploadQueue => uploadQueue.splice(1))
    }
    const _keepProcess = async id => {
      queryStatus(id).then(res => {
        if (isSubscription.current) {
          if (res && res.status === 200) {
            const percent = _calPercent(res.data);
            setLoadingPercent(Math.floor(percent * 100) / 100);
            percent >= 100
              ? _finishOneUpload()
              : (function () { setLoadingPercent(percent); timeout = setTimeout(() => { _keepProcess(id) }, 500) }())
          } else {
            setNavTitle(<div style={{ alignItems: 'center', display: 'flex', }}><WarnningIcon style={{ color: 'yellow', marginRight: '50px' }} /><span>UPLOAD FAIL</span></div>)
          }
        }
      })
    }
    const _uploadOneGif = async file => {
      const reader = new FileReader();
      reader.addEventListener("load", function () {
        GifUploading.current = reader.result;
        setNavTitle('UPLOADING...');
        upload(file).then(res => {
          if (isSubscription.current) {
            if (res && res.status === 200) {
              const id = res.data.id;
              uploaderID.current = id;
              _keepProcess(id);
            } else {
              setNavTitle(<div style={{ alignItems: 'center', display: 'flex', }}><WarnningIcon style={{ color: 'yellow', marginRight: '50px' }} /><span>UPLOAD FAIL</span></div>)
              setUploadQueue([]);
            }
          }
        })
      }, false);
      reader.readAsDataURL(file)
    }
    if (uploadQueue.length) {
      _uploadOneGif(uploadQueue[0])
    }
    return () => {
      timeout && clearTimeout(timeout)
      isSubscription.current = false;
    }
    //eslint-disable-next-line
  }, [uploadQueue])

  return (
    <div className={classes.root}>
      <div className={results.length ? classes.container : classes.noResContainer}>
        {
          navTitle === 'UPLOADING...'
            ? (
              <div className={classes.imgWrapper} >
                <GifPlayer gif={GifUploading.current} autoplay />
                {loadingPercent < 100 && (
                  <>
                    <div className={classes.cover} />
                    <div className={classes.percent}>{`${loadingPercent}%`}</div>
                  </>
                )}
              </div>
            ) : (
              <FileDrop>
                <div className={classes.addWrapper} ref={uploader} onClick={() => clickUpload()} >
                  <AddIcon />
                  <input type="file" style={{ display: 'none' }} ref={FileUploader} multiple />
                </div>
              </FileDrop>
            )
        }
        {results.length === 0 ?
          (
            <div style={{
              fontFamily: `Roboto-Regular,Roboto`,
              fontWeight: 400,
              color: `rgba(250,250,250,1)`,
              minWidth:'400px'
            }}>
              <div style={{
                display: `flex`,
                justifyContent: 'start',
                alignItems: 'center'
              }}>
                <p>Drop or click</p>&nbsp;
                <AddIcon />&nbsp;
                <p>to upload videos to the library</p>
              </div>
            </div>
          ) : (
            <>
              <FlipMove duration={500}>
                {results.map((data) => {
                  const isSelected = data.name === selectedID;
                  return (
                    <div className={`${classes.imgWrapper} ${isSelected ? classes.selected : ""}`}
                      key={data.name}
                      onMouseOver={() => { onMouseOver(data.name); }}
                      onMouseLeave={() => { onMouseLeave(data.name); }}
                    >
                      <GifPlayer gif={data.data} autoplay />
                      {isSelected && <div style={{ position: 'absolute', top: 0, right: 0 }}><DeleteIcon classes={{ root: classes.delete }} onClick={() => deleteGif(data.name)} /></div>}
                    </div>
                  )
                })}
              </FlipMove>
              {results.length < 6 && (
                <>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i, index) => {
                    return <div key={`key${index}`} className={classes.imgWrapper} style={{ visibility: 'hidden', height: '300px' }}></div>
                  })}
                </>
              )}
            </>
          )}

      </div>
    </div>)
};

export default Libarary;
