import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Typography, Grid, Box, Container, Button } from '@material-ui/core'
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles'
import GalleryCard, { LoadingCard } from 'src/index/GalleryCard'
import message from 'components/message'
import { useInViewport } from '@umijs/hooks'
import useSWR, { useSWRPages, cache } from 'swr'
import { axios } from 'apis'
import { GalleriesPage } from 'interface/gallery'
import useInViewportWithDistance from 'hooks/useInViewportWithDistance'
import { useTranslation } from 'i18n'
export const useStyles = makeStyles((theme) =>
  createStyles({
    searchButton: { marginLeft: theme.spacing(1) },
    title: { fontSize: '10pt', height: 36, overflow: 'hidden' },
    card: { margin: theme.spacing(0, 'auto') },
    btn: { margin: theme.spacing(1, 0) },
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      [theme.breakpoints.between(1000, 1250)]: {
        gridTemplateColumns: 'repeat(4, 1fr)',
      },
      [theme.breakpoints.between(750, 1000)]: {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
      [theme.breakpoints.between('xs', 750)]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      [theme.breakpoints.down('xs')]: {
        gridTemplateColumns: 'repeat(1, 1fr)',
      },
    },
  })
)
const FavoritesGalleryList: React.FC<{ favcat?: string }> = ({
  favcat = 'all',
}) => {
  const classes = useStyles()
  const router = useRouter()
  const [inview, inviewRef] = useInViewportWithDistance(600)
  const [t] = useTranslation()

  const pageSize = 50

  const {
    pages,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    isEmpty,
  } = useSWRPages<number | null, GalleriesPage>(
    'favoritesGallery' + favcat,
    ({ offset, withSWR }) => {
      const url = `/api/favorites?page=${offset || 0}&favcat=${favcat}`
      const { data } = withSWR(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useSWR<GalleriesPage>(url, async (url) => {
          const res = await axios.get<GalleriesPage>(url)
          return res.data
        })
      )
      if (!data)
        return new Array(pageSize)
          .fill(0)
          .map((_, k) => <LoadingCard key={k} />)
      if (data.total === 0) return []
      return data.list!.map((o, k) => (
        <Grid item xs key={o.gid} data-index={(offset || 0) * pageSize + k}>
          <GalleryCard record={o} />
        </Grid>
      ))
    },
    ({ data }, index) => {
      if (data?.error) return null
      if (data!.total! <= (index + 1) * pageSize) return null
      return index + 1
    },
    [favcat]
  )
  useEffect(() => {
    if (inview && !isLoadingMore && !isReachingEnd) loadMore()
  }, [inview, isLoadingMore, isReachingEnd, loadMore])

  if (isEmpty)
    return (
      <Box>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('Search.NoThisFound')}
        </Typography>
      </Box>
    )
  return (
    <Box>
      <Grid
        container
        wrap="wrap"
        justify="flex-start"
        className={classes.container}
        spacing={2}
      >
        {pages}
      </Grid>
      {!isEmpty && (
        <Button
          buttonRef={inviewRef}
          fullWidth
          disabled={isLoadingMore || isReachingEnd}
          className={classes.btn}
        >
          {isReachingEnd
            ? t('ReachEnd')
            : isLoadingMore
            ? t('Loading') + '...'
            : t('More')}
        </Button>
      )}
    </Box>
  )
}

export default FavoritesGalleryList
